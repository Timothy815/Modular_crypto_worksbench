import { isCompositeDefinition, isIteratorDefinition } from '../composites';
import type {
  ConnectionEndpoint,
  ModuleDefinition,
  ModuleInstance,
  ModuleRegistry,
  Project,
} from '../types';
import { isStatefulModule, isTickSliceable } from '../types';
import { validateProject } from '../validation';

const SUPPORTED_PYTHON_EXPORT_DEF_IDS = new Set([
  'TextInput',
  'KeyInput',
  'AsciiSource',
  'BitSource',
  'HexSource',
  'IV',
  'Nonce',
  'Salt',
  'Output',
  'TextOutput',
  'BitsToAscii',
  'BitOutput',
  'HexOutput',
  'SymbolPermutation',
  'SymbolWindow',
  'SymbolToBits',
  'BitsToSymbol',
  'BitsToHex',
  'HexToAscii',
  'AsciiToHex',
  'XOR',
  'AND',
  'OR',
  'NOT',
  'Gate',
  'Equals',
  'AtLeast',
  'Mux',
  'Demux',
  'MultiRouter',
  'SBox',
  'AddMod',
  'SubMod',
  'Modulo',
  'MulMod',
  'Majority',
  'GreaterThan',
  'Permutation',
  'ByteRotate',
  'ByteSwap',
  'BitJoin',
  'BitSplit',
  'BitPad',
  'BitUnpad',
  'BitWindow',
  'BitShifter',
]);

const SYMBOL_SINK_DEF_IDS = new Set(['Output', 'TextOutput']);
const BIT_SINK_DEF_IDS = new Set(['BitOutput']);
const HEX_SINK_DEF_IDS = new Set(['HexOutput']);

const PYTHON_RUNTIME = `def _expect_bits(signal, module_name):
    if not isinstance(signal, list):
        raise ValueError(f"{module_name} expects a bits signal")
    bits = []
    for bit in signal:
        if bit not in (0, 1):
            raise ValueError(f"{module_name} expects bits to contain only 0 or 1")
        bits.append(int(bit))
    return bits


def _require_equal_bit_widths(left, right, module_name):
    if len(left) != len(right):
        raise ValueError(f"{module_name} expects equal-width bits inputs")
    return len(left)


def _bits_to_unsigned_number(bits):
    value = 0
    for bit in bits:
        value = (value << 1) | bit
    return value


def _unsigned_number_to_bits(value, width):
    bits = []
    for shift in range(width - 1, -1, -1):
        bits.append((int(value) >> shift) & 1)
    return bits


def _expect_single_bit_word(bits, label, module_name):
    if len(bits) != 1:
        raise ValueError(f"{module_name} expects {label} to be a 1-bit word")
    return bits[0]


def _expect_control_bits(signal, module_name):
    return _expect_bits(signal, module_name)


def _is_active_control_pulse(bits):
    return len(bits) == 1 and bits[0] == 1


def _single_bit_control(active):
    return [1 if active else 0]


def text_input(value):
    return {"out": str(value)}


def key_input(value):
    return {"out": str(value)}


def ascii_source(value):
    text = str(value)
    bits = []
    for char in text:
        code = ord(char)
        if code > 0x7F:
            raise ValueError("AsciiSource accepts only 7-bit ASCII characters")
        for shift in (7, 6, 5, 4, 3, 2, 1, 0):
            bits.append((code >> shift) & 1)
    return {"out": bits}


def bit_source(stream):
    return {"out": _expect_bits(stream, "BitSource")}


def hex_source(value):
    normalized = str(value).strip().replace(" ", "").upper()
    if normalized and any(char not in "0123456789ABCDEF" for char in normalized):
        raise ValueError("HexSource accepts only hexadecimal characters 0-9 and A-F")
    bits = []
    for digit in normalized:
        nibble = int(digit, 16)
        for shift in (3, 2, 1, 0):
            bits.append((nibble >> shift) & 1)
    return {"out": bits}


def protocol_material_source(value, width, module_name):
    normalized = str(value).strip().replace(" ", "").upper()
    if normalized and any(char not in "0123456789ABCDEF" for char in normalized):
        raise ValueError(f"{module_name} accepts only hexadecimal characters 0-9 and A-F")
    width = int(width)
    if width <= 0:
        raise ValueError("Protocol-material width must be a positive integer")
    if width % 4 != 0:
        raise ValueError("Protocol-material width must be a multiple of 4 bits")
    bits = []
    for digit in normalized:
        nibble = int(digit, 16)
        for shift in (3, 2, 1, 0):
            bits.append((nibble >> shift) & 1)
    if len(bits) > width:
        raise ValueError(f"{module_name} value exceeds declared width")
    return {"out": bits + [0 for _ in range(width - len(bits))]}


def symbol_to_bits(signal):
    symbol = str(signal)
    if len(symbol) != 1:
        raise ValueError(f'SymbolToBits expects exactly one symbol, received "{symbol}"')
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    index = alphabet.find(symbol.upper())
    if index == -1:
        raise ValueError(f'SymbolToBits: "{symbol}" is not in the alphabet')
    bits = []
    for shift in (4, 3, 2, 1, 0):
        bits.append((index >> shift) & 1)
    return {"out": bits}


def bits_to_symbol(signal):
    bits = _expect_bits(signal, "BitsToSymbol")
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    index = _bits_to_unsigned_number(bits)
    index = ((index % 26) + 26) % 26
    return {"out": alphabet[index]}


def bits_to_ascii(signal):
    bits = _expect_bits(signal, "BitsToAscii")
    if len(bits) % 8 != 0:
        raise ValueError("BitsToAscii expects a bit width divisible by 8")
    chars = []
    for index in range(0, len(bits), 8):
        chunk = bits[index:index + 8]
        value = _bits_to_unsigned_number(chunk)
        if value > 0x7F:
            raise ValueError("BitsToAscii can only decode 7-bit ASCII byte values (0-127)")
        chars.append(chr(value))
    return {"out": "".join(chars)}


def bits_to_hex(signal):
    bits = _expect_bits(signal, "BitsToHex")
    if len(bits) % 4 != 0:
        raise ValueError("BitsToHex expects a bit width divisible by 4")
    digits = []
    for index in range(0, len(bits), 4):
        digits.append(format(_bits_to_unsigned_number(bits[index:index + 4]), "X"))
    return {"out": "".join(digits)}


def hex_to_ascii(signal):
    value = str(signal).strip().replace(" ", "").upper()
    if any(char not in "0123456789ABCDEF" for char in value):
        raise ValueError("HexToAscii accepts only hexadecimal characters 0-9 and A-F")
    if len(value) % 2 != 0:
        raise ValueError("HexToAscii expects an even number of hex digits")
    chars = []
    for index in range(0, len(value), 2):
        byte = int(value[index:index + 2], 16)
        if byte > 0x7F:
            raise ValueError("HexToAscii can only decode 7-bit ASCII byte values (00-7F)")
        chars.append(chr(byte))
    return {"out": "".join(chars)}


def ascii_to_hex(signal):
    text = str(signal)
    bytes_out = []
    for char in text:
        code = ord(char)
        if code > 0x7F:
            raise ValueError("AsciiToHex can only encode 7-bit ASCII characters (code points 0-127)")
        bytes_out.append(format(code, "02X"))
    return {"out": "".join(bytes_out)}


def _parse_symbol_permutation(order_value):
    parts = [part.strip() for part in str(order_value).split(",") if part.strip()]
    if not parts:
        raise ValueError("Symbol permutation order cannot be empty")
    order = []
    for part in parts:
        index = int(part)
        if index < 0:
            raise ValueError("Permutation order must contain only non-negative integers")
        order.append(index)
    if len(set(order)) != len(order):
        raise ValueError("Symbol permutation order must use each input index exactly once")
    max_index = len(order) - 1
    if any(index > max_index for index in order):
        raise ValueError(f"Symbol permutation order must stay within 0-{max_index}")
    return order


def symbol_permutation(signal, order_value):
    symbol = str(signal)
    order = _parse_symbol_permutation(order_value)
    characters = list(symbol)
    if len(characters) != len(order):
        raise ValueError(
            f"SymbolPermutation order length ({len(order)}) must match the input symbol length ({len(characters)})"
        )
    return {"out": "".join(characters[index] for index in order)}


def symbol_window(signal, start, width):
    symbol = str(signal)
    characters = list(symbol)
    start = int(start)
    width = int(width)
    if start < 0:
        raise ValueError("SymbolWindow start must be a non-negative integer.")
    if width < 1:
        raise ValueError("SymbolWindow width must be a positive integer.")
    if start + width > len(characters):
        raise ValueError(
            f"SymbolWindow range ({start}-{start + width - 1}) exceeds input length ({len(characters)})"
        )
    return {"out": "".join(characters[start:start + width])}


def xor_bits(a, b):
    left = _expect_bits(a, "XOR")
    right = _expect_bits(b, "XOR")
    width = min(len(left), len(right))
    return {"out": [left[index] ^ right[index] for index in range(width)]}


def and_bits(a, b):
    left = _expect_bits(a, "AND")
    right = _expect_bits(b, "AND")
    width = _require_equal_bit_widths(left, right, "AND")
    return {"out": [left[index] & right[index] for index in range(width)]}


def or_bits(a, b):
    left = _expect_bits(a, "OR")
    right = _expect_bits(b, "OR")
    width = _require_equal_bit_widths(left, right, "OR")
    return {"out": [left[index] | right[index] for index in range(width)]}


def not_bits(signal):
    bits = _expect_bits(signal, "NOT")
    return {"out": [0 if bit == 1 else 1 for bit in bits]}


def gate_bits(signal, control):
    bits = _expect_bits(signal, "Gate")
    control_bits = _expect_control_bits(control, "Gate")
    active = _is_active_control_pulse(control_bits)
    return {"out": bits[:] if active else [0 for _ in bits]}


def equals_bits(a, b):
    left = _expect_bits(a, "Equals")
    right = _expect_bits(b, "Equals")
    width = _require_equal_bit_widths(left, right, "Equals")
    for index in range(width):
        if left[index] != right[index]:
            return {"out": _single_bit_control(False)}
    return {"out": _single_bit_control(True)}


def at_least_bits(a, b):
    left = _expect_bits(a, "AtLeast")
    right = _expect_bits(b, "AtLeast")
    _require_equal_bit_widths(left, right, "AtLeast")
    return {"out": _single_bit_control(_bits_to_unsigned_number(left) >= _bits_to_unsigned_number(right))}


def majority_bits(a, b, c):
    left = _expect_single_bit_word(_expect_bits(a, "Majority"), "input a", "Majority")
    middle = _expect_single_bit_word(_expect_bits(b, "Majority"), "input b", "Majority")
    right = _expect_single_bit_word(_expect_bits(c, "Majority"), "input c", "Majority")
    return {"out": _single_bit_control((left + middle + right) >= 2)}


def greater_than_bits(a, b):
    left = _expect_bits(a, "GreaterThan")
    right = _expect_bits(b, "GreaterThan")
    _require_equal_bit_widths(left, right, "GreaterThan")
    return {"out": _single_bit_control(_bits_to_unsigned_number(left) > _bits_to_unsigned_number(right))}


def mux_bit(select, a, b):
    select_bit = _expect_single_bit_word(_expect_bits(select, "Mux"), "select", "Mux")
    a_bit = _expect_single_bit_word(_expect_bits(a, "Mux"), "input a", "Mux")
    b_bit = _expect_single_bit_word(_expect_bits(b, "Mux"), "input b", "Mux")
    return {"out": [b_bit if select_bit == 1 else a_bit]}


def demux_bit(select, signal):
    select_bit = _expect_single_bit_word(_expect_bits(select, "Demux"), "select", "Demux")
    input_bit = _expect_single_bit_word(_expect_bits(signal, "Demux"), "input", "Demux")
    return {
        "a": [input_bit if select_bit == 0 else 0],
        "b": [input_bit if select_bit == 1 else 0],
    }


def multi_router(select, signal, route_count):
    bits = _expect_bits(signal, "MultiRouter")
    select_bits = _expect_bits(select, "MultiRouter")
    route_count = int(route_count)
    if route_count not in (2, 4, 8):
        raise ValueError('MultiRouter requires "routeCount" to be 2, 4, or 8')
    required_select_width = {2: 1, 4: 2, 8: 3}[route_count]
    if len(select_bits) != required_select_width:
        raise ValueError(
            f"MultiRouter expects select to be a {required_select_width}-bit word when routeCount is {route_count}"
        )
    selected_index = _bits_to_unsigned_number(select_bits)
    zero_word = [0 for _ in bits]
    outputs = {}
    for index in range(8):
        key = f"out{index}"
        if index < route_count and index == selected_index:
            outputs[key] = bits[:]
        else:
            outputs[key] = zero_word[:]
    return outputs


def _parse_s_box_table(table_value):
    parts = [part.strip() for part in str(table_value).split(",") if part.strip()]
    if not parts:
        raise ValueError("SBox table cannot be empty")
    entry_count = len(parts)
    width = 0
    remaining = entry_count
    while remaining > 1 and remaining % 2 == 0:
        remaining //= 2
        width += 1
    if remaining != 1 or width < 1:
        raise ValueError("SBox table length must be a power of two")
    max_entry = (1 << width) - 1
    entries = []
    for part in parts:
        entry = int(part)
        if entry < 0 or entry > max_entry:
            raise ValueError(f"SBox entries must be integers between 0 and {max_entry}")
        entries.append(entry)
    if len(set(entries)) != len(entries):
        raise ValueError("SBox table must be a permutation with no duplicates")
    return entries, width


def s_box(signal, table):
    bits = _expect_bits(signal, "SBox")
    if not bits:
        return {"out": []}
    entries, width = _parse_s_box_table(table)
    if len(bits) % width != 0:
        raise ValueError(f"SBox input width must be a multiple of {width} bits")
    output = []
    for index in range(0, len(bits), width):
        chunk = bits[index:index + width]
        output.extend(_unsigned_number_to_bits(entries[_bits_to_unsigned_number(chunk)], width))
    return {"out": output}


def add_mod(a, b):
    left = _expect_bits(a, "ADD mod 2^n")
    right = _expect_bits(b, "ADD mod 2^n")
    width = _require_equal_bit_widths(left, right, "ADD mod 2^n")
    if width == 0:
        return {"out": []}
    modulus = 2 ** width
    result = (_bits_to_unsigned_number(left) + _bits_to_unsigned_number(right)) % modulus
    return {"out": _unsigned_number_to_bits(result, width)}


def sub_mod(a, b):
    left = _expect_bits(a, "SUB mod 2^n")
    right = _expect_bits(b, "SUB mod 2^n")
    width = _require_equal_bit_widths(left, right, "SUB mod 2^n")
    if width == 0:
        return {"out": []}
    modulus = 2 ** width
    result = (_bits_to_unsigned_number(left) - _bits_to_unsigned_number(right) + modulus) % modulus
    return {"out": _unsigned_number_to_bits(result, width)}


def modulo_bits(signal, modulus):
    bits = _expect_bits(signal, "Modulo")
    modulus = int(modulus)
    if modulus <= 0:
        raise ValueError("Modulo requires a positive integer modulus")
    if not bits:
        return {"out": []}
    max_value = 2 ** len(bits)
    if modulus > max_value:
        raise ValueError("Modulo requires a modulus no larger than the input word range")
    return {"out": _unsigned_number_to_bits(_bits_to_unsigned_number(bits) % modulus, len(bits))}


def mul_mod(a, b):
    left = _expect_bits(a, "MUL mod 2^n")
    right = _expect_bits(b, "MUL mod 2^n")
    width = _require_equal_bit_widths(left, right, "MUL mod 2^n")
    if width == 0:
        return {"out": []}
    modulus = 2 ** width
    result = (_bits_to_unsigned_number(left) * _bits_to_unsigned_number(right)) % modulus
    return {"out": _unsigned_number_to_bits(result, width)}


def permute_bits(signal, order):
    bits = _expect_bits(signal, "Permutation")
    parts = [part.strip() for part in str(order).split(",") if part.strip()]
    if not parts:
        raise ValueError("Permutation order cannot be empty")
    permutation = []
    for part in parts:
        index = int(part)
        if index < 0:
            raise ValueError("Permutation order must contain only non-negative integers")
        if index >= len(bits):
            raise ValueError("Permutation order index is out of range for the input width")
        permutation.append(index)
    return {"out": [bits[index] for index in permutation]}


def bit_join(a, b):
    left = _expect_bits(a, "BitJoin")
    right = _expect_bits(b, "BitJoin")
    return {"out": left + right}


def bit_split(signal, left_width):
    bits = _expect_bits(signal, "BitSplit")
    left_width = int(left_width)
    if left_width < 1:
        raise ValueError("BitSplit leftWidth must be a positive integer.")
    if left_width > len(bits):
        raise ValueError(f"BitSplit leftWidth ({left_width}) exceeds input length ({len(bits)})")
    return {
        "left": bits[:left_width],
        "right": bits[left_width:],
    }


def bit_pad(signal, target_width, side, pad_bit):
    bits = _expect_bits(signal, "BitPad")
    target_width = int(target_width)
    if target_width < 1:
        raise ValueError("BitPad targetWidth must be a positive integer.")
    if len(bits) >= target_width:
        return {"out": bits[:]}
    pad_count = target_width - len(bits)
    pad_bit_value = 1 if str(pad_bit) == "1" else 0
    padding = [pad_bit_value for _ in range(pad_count)]
    side = "left" if side == "left" else "right"
    return {"out": padding + bits if side == "left" else bits + padding}


def bit_unpad(signal, original_width, side):
    bits = _expect_bits(signal, "BitUnpad")
    original_width = int(original_width)
    if original_width < 1:
        raise ValueError("BitUnpad originalWidth must be a positive integer.")
    if len(bits) <= original_width:
        return {"out": bits[:]}
    side = "left" if side == "left" else "right"
    return {"out": bits[len(bits) - original_width:] if side == "left" else bits[:original_width]}


def bit_window(signal, start, width):
    bits = _expect_bits(signal, "BitWindow")
    start = int(start)
    width = int(width)
    if start < 0:
        raise ValueError("BitWindow start must be a non-negative integer.")
    if width < 1:
        raise ValueError("BitWindow width must be a positive integer.")
    if start + width > len(bits):
        raise ValueError(f"BitWindow range ({start}-{start + width - 1}) exceeds input length ({len(bits)})")
    return {"out": bits[start:start + width]}


def bit_shift(signal, amount, mode):
    bits = _expect_bits(signal, "BitShifter")
    amount = max(0, int(amount))
    mode = str(mode)
    if not bits:
        return {"out": []}
    if mode == "left":
        if amount >= len(bits):
            return {"out": [0 for _ in bits]}
        return {"out": bits[amount:] + [0 for _ in range(amount)]}
    if mode == "right":
        if amount >= len(bits):
            return {"out": [0 for _ in bits]}
        return {"out": [0 for _ in range(amount)] + bits[:len(bits) - amount]}
    if mode == "rotate-left":
        offset = amount % len(bits)
        return {"out": bits[offset:] + bits[:offset]}
    if mode == "rotate-right":
        offset = amount % len(bits)
        if offset == 0:
            return {"out": bits[:]}
        return {"out": bits[len(bits) - offset:] + bits[:len(bits) - offset]}
    raise ValueError(f'Unsupported BitShifter mode "{mode}"')


def byte_rotate(signal, amount, direction):
    bits = _expect_bits(signal, "ByteRotate")
    if not bits:
        return {"out": []}
    if len(bits) % 8 != 0:
        raise ValueError("ByteRotate expects an input width divisible by 8")
    amount = int(amount)
    if amount < 1:
        raise ValueError("ByteRotate amount must be a positive integer.")
    direction = "right" if direction == "right" else "left"
    byte_count = len(bits) // 8
    offset = amount % byte_count
    if offset == 0:
        return {"out": bits[:]}
    bytes_out = [bits[index:index + 8] for index in range(0, len(bits), 8)]
    rotated = (
        bytes_out[offset:] + bytes_out[:offset]
        if direction == "left"
        else bytes_out[byte_count - offset:] + bytes_out[:byte_count - offset]
    )
    flattened = []
    for byte in rotated:
        flattened.extend(byte)
    return {"out": flattened}


def byte_swap(signal):
    bits = _expect_bits(signal, "ByteSwap")
    if not bits:
        return {"out": []}
    if len(bits) % 8 != 0:
        raise ValueError("ByteSwap expects an input width divisible by 8")
    bytes_out = [bits[index:index + 8] for index in range(0, len(bits), 8)]
    bytes_out.reverse()
    flattened = []
    for byte in bytes_out:
        flattened.extend(byte)
    return {"out": flattened}


def format_symbol_sink(value):
    return str(value)


def format_bit_sink(value):
    bits = _expect_bits(value, "BitOutput")
    return "".join(str(bit) for bit in bits)


def format_hex_sink(value):
    return str(value).upper()
`;

export interface PythonExportCompatibilityIssue {
  moduleId: string;
  defId: string;
  reason: string;
}

export interface PythonExportCompatibilityResult {
  ok: boolean;
  issues: PythonExportCompatibilityIssue[];
}

function getModuleInstanceMap(project: Project) {
  return new Map(project.modules.map((moduleInstance) => [moduleInstance.id, moduleInstance]));
}

function sanitizeIdentifierPart(value: string) {
  const normalized = value.replace(/[^A-Za-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  const safe = normalized.length > 0 ? normalized : 'module';
  return /^[0-9]/.test(safe) ? `m_${safe}` : safe;
}

export function sanitizePythonIdentifier(value: string) {
  return sanitizeIdentifierPart(value);
}

export function sanitizePythonFileStem(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.length > 0 ? normalized : 'workspace';
}

export function getPythonExportFileName(workspaceName: string) {
  return `${sanitizePythonFileStem(workspaceName)}.py`;
}

function buildPythonVariableMap(project: Project) {
  const used = new Set<string>();
  const variables = new Map<string, string>();

  for (const moduleInstance of project.modules) {
    const base = sanitizeIdentifierPart(moduleInstance.id);
    let candidate = `m_${base}`;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `m_${base}_${suffix}`;
      suffix += 1;
    }
    used.add(candidate);
    variables.set(moduleInstance.id, candidate);
  }

  return variables;
}

function buildTopologicalOrder(project: Project): string[] {
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  for (const moduleInstance of project.modules) {
    adjacency.set(moduleInstance.id, []);
    indegree.set(moduleInstance.id, 0);
  }

  for (const connection of project.connections) {
    adjacency.get(connection.from.moduleId)?.push(connection.to.moduleId);
    indegree.set(connection.to.moduleId, (indegree.get(connection.to.moduleId) ?? 0) + 1);
  }

  const ready = project.modules
    .map((moduleInstance) => moduleInstance.id)
    .filter((moduleId) => (indegree.get(moduleId) ?? 0) === 0);
  const order: string[] = [];

  while (ready.length > 0) {
    const nextModuleId = ready.shift();
    if (!nextModuleId) {
      continue;
    }

    order.push(nextModuleId);
    for (const neighbor of adjacency.get(nextModuleId) ?? []) {
      const nextDegree = (indegree.get(neighbor) ?? 0) - 1;
      indegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        ready.push(neighbor);
      }
    }
  }

  if (order.length !== project.modules.length) {
    throw new Error('Cannot generate Python export for a cyclic project graph.');
  }

  return order;
}

function getResolvedParamValue(moduleInstance: ModuleInstance, def: ModuleDefinition, key: string) {
  const field = def.paramSchema[key];
  if (!field) {
    return moduleInstance.params[key];
  }

  return moduleInstance.params[key] ?? field.defaultValue;
}

function toPythonLiteral(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => toPythonLiteral(entry)).join(', ')}]`;
  }

  if (value === null || value === undefined) {
    return 'None';
  }

  return JSON.stringify(value);
}

function getInputConnectionMap(project: Project) {
  return new Map(
    project.connections.map((connection) => [
      `${connection.to.moduleId}:${connection.to.port}`,
      connection.from,
    ]),
  );
}

function getInputExpression(
  connectionsByTarget: Map<string, ConnectionEndpoint>,
  variablesByModuleId: Map<string, string>,
  moduleId: string,
  portName: string,
) {
  const source = connectionsByTarget.get(`${moduleId}:${portName}`);
  if (!source) {
    throw new Error(`Python export could not resolve input "${moduleId}.${portName}".`);
  }

  const variableName = variablesByModuleId.get(source.moduleId);
  if (!variableName) {
    throw new Error(`Python export could not resolve module "${source.moduleId}".`);
  }

  return `${variableName}[${JSON.stringify(source.port)}]`;
}

function buildModuleExpression(
  moduleInstance: ModuleInstance,
  def: ModuleDefinition,
  connectionsByTarget: Map<string, ConnectionEndpoint>,
  variablesByModuleId: Map<string, string>,
) {
  const moduleId = moduleInstance.id;

  switch (def.id) {
    case 'TextInput':
      return `text_input(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'value'))})`;
    case 'KeyInput':
      return `key_input(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'value'))})`;
    case 'AsciiSource':
      return `ascii_source(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'value'))})`;
    case 'BitSource':
      return `bit_source(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'stream'))})`;
    case 'HexSource':
      return `hex_source(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'value'))})`;
    case 'IV':
      return `protocol_material_source(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'value'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'width'))}, "IV")`;
    case 'Nonce':
      return `protocol_material_source(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'value'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'width'))}, "Nonce")`;
    case 'Salt':
      return `protocol_material_source(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'value'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'width'))}, "Salt")`;
    case 'SymbolToBits':
      return `symbol_to_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')})`;
    case 'SymbolPermutation':
      return `symbol_permutation(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'order'))})`;
    case 'SymbolWindow':
      return `symbol_window(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'start'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'width'))})`;
    case 'BitsToSymbol':
      return `bits_to_symbol(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')})`;
    case 'BitsToAscii':
      return `bits_to_ascii(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')})`;
    case 'BitsToHex':
      return `bits_to_hex(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')})`;
    case 'HexToAscii':
      return `hex_to_ascii(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')})`;
    case 'AsciiToHex':
      return `ascii_to_hex(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')})`;
    case 'XOR':
      return `xor_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'AND':
      return `and_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'OR':
      return `or_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'NOT':
      return `not_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')})`;
    case 'Gate':
      return `gate_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'control')})`;
    case 'Equals':
      return `equals_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'AtLeast':
      return `at_least_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'Majority':
      return `majority_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'c')})`;
    case 'GreaterThan':
      return `greater_than_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'Mux':
      return `mux_bit(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'select')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'Demux':
      return `demux_bit(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'select')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')})`;
    case 'MultiRouter':
      return `multi_router(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'select')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'routeCount'))})`;
    case 'SBox':
      return `s_box(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'table'))})`;
    case 'AddMod':
      return `add_mod(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'SubMod':
      return `sub_mod(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'Modulo':
      return `modulo_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'modulus'))})`;
    case 'MulMod':
      return `mul_mod(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'Permutation':
      return `permute_bits(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'order'))})`;
    case 'ByteRotate':
      return `byte_rotate(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'amount'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'direction'))})`;
    case 'ByteSwap':
      return `byte_swap(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')})`;
    case 'BitJoin':
      return `bit_join(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'a')}, ${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'b')})`;
    case 'BitSplit':
      return `bit_split(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'leftWidth'))})`;
    case 'BitPad':
      return `bit_pad(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'targetWidth'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'side'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'padBit'))})`;
    case 'BitUnpad':
      return `bit_unpad(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'originalWidth'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'side'))})`;
    case 'BitWindow':
      return `bit_window(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'start'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'width'))})`;
    case 'BitShifter':
      return `bit_shift(${getInputExpression(connectionsByTarget, variablesByModuleId, moduleId, 'in')}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'amount'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'mode'))})`;
    default:
      throw new Error(`Python export does not support module "${def.id}".`);
  }
}

function buildSinkCaptureLine(
  moduleInstance: ModuleInstance,
  def: ModuleDefinition,
  connectionsByTarget: Map<string, ConnectionEndpoint>,
  variablesByModuleId: Map<string, string>,
) {
  const inputExpression = getInputExpression(
    connectionsByTarget,
    variablesByModuleId,
    moduleInstance.id,
    'in',
  );

  if (SYMBOL_SINK_DEF_IDS.has(def.id)) {
    return `    sink_outputs.append((${JSON.stringify(moduleInstance.id)}, format_symbol_sink(${inputExpression})))`;
  }

  if (BIT_SINK_DEF_IDS.has(def.id)) {
    return `    sink_outputs.append((${JSON.stringify(moduleInstance.id)}, format_bit_sink(${inputExpression})))`;
  }

  if (HEX_SINK_DEF_IDS.has(def.id)) {
    return `    sink_outputs.append((${JSON.stringify(moduleInstance.id)}, format_hex_sink(${inputExpression})))`;
  }

  throw new Error(`Python export does not support sink "${def.id}".`);
}

export function getPythonExportCompatibility(
  project: Project,
  registry: ModuleRegistry,
): PythonExportCompatibilityResult {
  const issues: PythonExportCompatibilityIssue[] = [];

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def) {
      issues.push({
        moduleId: moduleInstance.id,
        defId: moduleInstance.defId,
        reason: 'Unknown module definition.',
      });
      continue;
    }

    if (moduleInstance.bypass) {
      issues.push({
        moduleId: moduleInstance.id,
        defId: moduleInstance.defId,
        reason: 'Bypass behavior is not exportable in V1.',
      });
      continue;
    }

    if (isCompositeDefinition(def)) {
      issues.push({
        moduleId: moduleInstance.id,
        defId: moduleInstance.defId,
        reason: 'Composite definitions are not exportable in V1.',
      });
      continue;
    }

    if (isIteratorDefinition(def)) {
      issues.push({
        moduleId: moduleInstance.id,
        defId: moduleInstance.defId,
        reason: 'Iterator definitions are not exportable in V1.',
      });
      continue;
    }

    if (isStatefulModule(def) || (isTickSliceable(def) && !SUPPORTED_PYTHON_EXPORT_DEF_IDS.has(def.id))) {
      issues.push({
        moduleId: moduleInstance.id,
        defId: moduleInstance.defId,
        reason: 'Stateful or ticked execution is not exportable in V1.',
      });
      continue;
    }

    if (!SUPPORTED_PYTHON_EXPORT_DEF_IDS.has(def.id)) {
      issues.push({
        moduleId: moduleInstance.id,
        defId: moduleInstance.defId,
        reason: 'This primitive is outside the Python export V1 supported subset.',
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function formatPythonExportCompatibilityIssues(
  issues: PythonExportCompatibilityIssue[],
) {
  return issues
    .map((issue) => `${issue.moduleId} (${issue.defId}): ${issue.reason}`)
    .join('\n');
}

export function generatePythonExport(project: Project, registry: ModuleRegistry) {
  const validation = validateProject(project, registry);
  if (!validation.ok) {
    throw new Error(validation.issues.map((issue) => issue.message).join('\n'));
  }

  const compatibility = getPythonExportCompatibility(project, registry);
  if (!compatibility.ok) {
    throw new Error(formatPythonExportCompatibilityIssues(compatibility.issues));
  }

  const order = buildTopologicalOrder(project);
  const instancesById = getModuleInstanceMap(project);
  const variablesByModuleId = buildPythonVariableMap(project);
  const connectionsByTarget = getInputConnectionMap(project);
  const bodyLines: string[] = ['def run():', '    sink_outputs = []'];

  for (const moduleId of order) {
    const moduleInstance = instancesById.get(moduleId);
    if (!moduleInstance) {
      throw new Error(`Python export could not resolve module "${moduleId}".`);
    }

    const def = registry[moduleInstance.defId];
    if (!def || isCompositeDefinition(def) || isIteratorDefinition(def)) {
      throw new Error(`Python export encountered unsupported definition "${moduleInstance.defId}".`);
    }

    if (SYMBOL_SINK_DEF_IDS.has(def.id) || BIT_SINK_DEF_IDS.has(def.id) || HEX_SINK_DEF_IDS.has(def.id)) {
      bodyLines.push(buildSinkCaptureLine(moduleInstance, def, connectionsByTarget, variablesByModuleId));
      continue;
    }

    const variableName = variablesByModuleId.get(moduleId);
    if (!variableName) {
      throw new Error(`Python export could not resolve a variable for "${moduleId}".`);
    }

    bodyLines.push(
      `    ${variableName} = ${buildModuleExpression(moduleInstance, def, connectionsByTarget, variablesByModuleId)}`,
    );
  }

  bodyLines.push('    return sink_outputs', '', 'def main():', '    for module_id, value in run():', '        print(f"{module_id}: {value}")', '', 'if __name__ == "__main__":', '    main()');

  return `${PYTHON_RUNTIME}\n\n${bodyLines.join('\n')}\n`;
}
