import {
  isCompositeDefinition,
  isIteratorDefinition,
  type CompositeDef,
  type IteratorDef,
} from '../composites';
import { deriveTickCount } from '../executor';
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
  'BitsToBaudot',
  'BitOutput',
  'HexOutput',
  'BaudotOutput',
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
  'Clock',
  'Counter',
  'LFSR',
  'Rotor',
  'Reflector',
  'RotorReverse',
  'Plugboard',
]);

const SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS = new Set([
  'Clock',
  'Counter',
  'LFSR',
  'Rotor',
  'RotorReverse',
]);
const SUPPORTED_STATEFUL_PYTHON_EXPORT_COMPANION_DEF_IDS = new Set([
  'TextInput',
  'BitSource',
  'BitOutput',
  'Output',
  'TextOutput',
  'HexOutput',
  'BitsToHex',
  'KeyInput',
  'Equals',
  'AtLeast',
  'GreaterThan',
  'Gate',
  'Mux',
  'Demux',
  'MultiRouter',
  'BitJoin',
  'BitSplit',
  'BitPad',
  'BitWindow',
  'BitShifter',
  'Plugboard',
]);

const SYMBOL_SINK_DEF_IDS = new Set(['Output', 'TextOutput', 'BaudotOutput']);
const BIT_SINK_DEF_IDS = new Set(['BitOutput']);
const HEX_SINK_DEF_IDS = new Set(['HexOutput']);

const PYTHON_RUNTIME = `ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
ROTOR_SIZE = len(ALPHABET)


def _expect_bits(signal, module_name):
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


def text_input_tick(value, tick):
    text = str(value)
    return {"out": text[tick] if tick < len(text) else ""}


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


def bit_source_tick(stream, tick):
    bits = _expect_bits(stream, "BitSource")
    return {"out": [bits[tick]] if tick < len(bits) else []}


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


def bits_to_baudot(signal):
    bits = _expect_bits(signal, "BitsToBaudot")
    if len(bits) % 5 != 0:
        raise ValueError("BitsToBaudot expects a bit signal whose width is divisible by 5")
    table = [
        "",
        "E",
        "\\n",
        "A",
        " ",
        "S",
        "I",
        "U",
        "\\r",
        "D",
        "R",
        "J",
        "N",
        "F",
        "C",
        "K",
        "T",
        "Z",
        "L",
        "W",
        "H",
        "Y",
        "P",
        "Q",
        "O",
        "B",
        "G",
        "",
        "M",
        "X",
        "V",
        "",
    ]
    output = []
    for index in range(0, len(bits), 5):
        chunk = bits[index:index + 5]
        code = 0
        for bit in chunk:
            code = (code << 1) | bit
        output.append(table[code] if table[code] else "?")
    return {"out": "".join(output)}


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


def clock_tick(period, offset, length, tick):
    period = max(1, int(period))
    offset = max(0, int(offset))
    length = max(0, int(length))
    if tick >= length:
        return {"pulse": []}
    adjusted = tick - offset
    active = adjusted >= 0 and adjusted % period == 0
    return {"pulse": [1 if active else 0]}


def counter_init(width, value, step):
    width = int(width)
    step = int(step)
    value = int(value)
    if width <= 0:
        raise ValueError('Counter requires "width" to be a positive integer')
    if step <= 0:
        raise ValueError('Counter requires "step" to be a positive integer')
    if value < 0:
        raise ValueError('Counter requires "value" to be a non-negative integer')
    modulus = 2 ** width
    return {
        "width": width,
        "value": value % modulus,
        "step": step,
    }


def counter_eval(state):
    return {"out": _unsigned_number_to_bits(state["value"], state["width"])}


def counter_advance(state):
    modulus = 2 ** state["width"]
    state["value"] = (state["value"] + state["step"]) % modulus


def _parse_lfsr_taps(taps_value):
    if not isinstance(taps_value, str):
        raise ValueError("LFSR taps must be a comma-separated index list")
    parts = [part.strip() for part in taps_value.split(",") if part.strip()]
    if not parts:
        raise ValueError("LFSR taps cannot be empty")
    taps = [int(part) for part in parts]
    if any(index < 0 for index in taps):
        raise ValueError("LFSR taps must contain only non-negative integers")
    if len(set(taps)) != len(taps):
        raise ValueError("LFSR taps must not repeat indexes")
    return taps


def _lfsr_shift(register, taps):
    output_bit = register[-1]
    feedback = 0
    for tap in taps:
        feedback ^= register[tap]
    return output_bit, [feedback] + register[:-1]


def lfsr_init(seed, taps, output_length):
    register = _expect_bits(seed, "LFSR")
    if len(register) == 0:
        raise ValueError("LFSR seed cannot be empty")
    taps_parsed = _parse_lfsr_taps(taps)
    if any(index >= len(register) for index in taps_parsed):
        raise ValueError("LFSR tap index is out of range for the seed width")
    output_length = max(0, int(output_length))
    return {
        "seed": register[:],
        "taps": taps_parsed,
        "outputLength": output_length,
    }


def lfsr_eval(state):
    register = state["seed"][:]
    result = []
    for _ in range(state["outputLength"]):
        output_bit, register = _lfsr_shift(register, state["taps"])
        result.append(output_bit)
    return {"out": result}


def lfsr_advance(state):
    _, next_register = _lfsr_shift(state["seed"], state["taps"])
    state["seed"] = next_register


def _normalize_rotor_offset(value):
    return ((int(value) % ROTOR_SIZE) + ROTOR_SIZE) % ROTOR_SIZE


def _expect_rotor_symbol(signal):
    symbol = str(signal)
    if len(symbol) != 1:
        raise ValueError(f'Rotor expects exactly one symbol, received "{symbol}"')
    if ALPHABET.find(symbol.upper()) == -1:
        raise ValueError(f'Rotor: "{symbol}" is not in the alphabet')
    return symbol.upper()


def _parse_rotor_wiring(wiring_value):
    if not isinstance(wiring_value, list) or len(wiring_value) != ROTOR_SIZE:
        raise ValueError("Rotor wiring must be an array of 26 uppercase letters.")
    wiring = []
    for entry in wiring_value:
        if not isinstance(entry, str) or len(entry) != 1 or ALPHABET.find(entry.upper()) == -1:
            raise ValueError("Rotor wiring must be an array of 26 uppercase letters.")
        wiring.append(entry.upper())
    if len(set(wiring)) != ROTOR_SIZE:
        raise ValueError("Rotor wiring must be a permutation with no duplicates.")
    return wiring


def _parse_rotor_notches(notches_value):
    if not isinstance(notches_value, str) or len(notches_value.strip()) == 0:
        return []
    entries = [entry.strip().upper() for entry in notches_value.split(",") if entry.strip()]
    unique = []
    for entry in entries:
        if len(entry) != 1 or ALPHABET.find(entry) == -1:
            continue
        index = ALPHABET.index(entry)
        if index not in unique:
            unique.append(index)
    return unique


def _is_rotor_turnover_active(position, ring_offset, notches):
    normalized_position = _normalize_rotor_offset(position)
    normalized_ring_offset = _normalize_rotor_offset(ring_offset)
    for notch_index in notches:
        if normalized_position == _normalize_rotor_offset(notch_index - normalized_ring_offset):
            return True
    return False


def rotor_init(wiring, position, ring_offset, notches):
    return {
        "wiring": _parse_rotor_wiring(wiring),
        "position": _normalize_rotor_offset(position),
        "ringOffset": _normalize_rotor_offset(ring_offset),
        "notches": _parse_rotor_notches(notches),
    }


def rotor_traverse(signal, state):
    input_symbol = _expect_rotor_symbol(signal)
    input_index = ALPHABET.index(input_symbol)
    effective_shift = _normalize_rotor_offset(state["position"] - state["ringOffset"])
    shifted_index = _normalize_rotor_offset(input_index + effective_shift)
    mapped_index = ALPHABET.index(state["wiring"][shifted_index])
    unshifted_index = _normalize_rotor_offset(mapped_index - effective_shift)
    return ALPHABET[unshifted_index]


def rotor_eval(signal, state):
    turnover_active = _is_rotor_turnover_active(state["position"], state["ringOffset"], state["notches"])
    return {
        "out": rotor_traverse(signal, state),
        "turnover": [1 if turnover_active else 0],
    }


def rotor_advance(state):
    state["position"] = _normalize_rotor_offset(state["position"] + 1)


def _parse_reflector_wiring(wiring_value):
    if not isinstance(wiring_value, list) or len(wiring_value) != ROTOR_SIZE:
        raise ValueError("Reflector wiring must be an array of 26 uppercase letters.")
    wiring = []
    for entry in wiring_value:
        if not isinstance(entry, str) or len(entry) != 1 or ALPHABET.find(entry.upper()) == -1:
            raise ValueError("Reflector wiring must be an array of 26 uppercase letters.")
        wiring.append(entry.upper())
    if len(set(wiring)) != ROTOR_SIZE:
        raise ValueError("Reflector wiring must be a permutation with no duplicates.")
    for index, source in enumerate(ALPHABET):
        target = wiring[index]
        if target == source:
            raise ValueError("Reflector wiring cannot map a letter to itself.")
        target_index = ALPHABET.index(target)
        if wiring[target_index] != source:
            raise ValueError("Reflector wiring must be involutive: every pair must map back to itself.")
    return wiring


def reflector_traverse(signal, wiring):
    input_symbol = _expect_rotor_symbol(signal)
    reflected_index = ALPHABET.index(input_symbol)
    return wiring[reflected_index]


def _parse_plugboard_wiring(wiring_value):
    if not isinstance(wiring_value, list) or len(wiring_value) != ROTOR_SIZE:
        raise ValueError("Plugboard wiring must be an array of 26 uppercase letters.")
    wiring = []
    for entry in wiring_value:
        if not isinstance(entry, str) or len(entry) != 1 or ALPHABET.find(entry.upper()) == -1:
            raise ValueError("Plugboard wiring must be an array of 26 uppercase letters.")
        wiring.append(entry.upper())
    if len(set(wiring)) != ROTOR_SIZE:
        raise ValueError("Plugboard wiring must be a permutation with no duplicates.")
    for index, source in enumerate(ALPHABET):
        target = wiring[index]
        target_index = ALPHABET.index(target)
        if wiring[target_index] != source:
            raise ValueError("Plugboard wiring must be reciprocal: every mapped pair must map back to itself.")
    return wiring


def plugboard_eval(signal, wiring):
    symbol = str(signal)
    if len(symbol) != 1:
        raise ValueError("Plugboard expects a symbol signal")
    normalized = symbol.upper()
    index = ALPHABET.find(normalized)
    if index == -1:
        raise ValueError(f'Plugboard: "{symbol}" is not in the alphabet')
    return {"out": wiring[index]}


def rotor_reverse_eval(signal, linked_rotor_state):
    input_symbol = _expect_rotor_symbol(signal)
    input_index = ALPHABET.index(input_symbol)
    effective_shift = _normalize_rotor_offset(linked_rotor_state["position"] - linked_rotor_state["ringOffset"])
    shifted_index = _normalize_rotor_offset(input_index + effective_shift)
    target_letter = ALPHABET[shifted_index]
    inverse_index = linked_rotor_state["wiring"].index(target_letter)
    unshifted_index = _normalize_rotor_offset(inverse_index - effective_shift)
    turnover_active = _is_rotor_turnover_active(
        linked_rotor_state["position"],
        linked_rotor_state["ringOffset"],
        linked_rotor_state["notches"],
    )
    return {
        "out": ALPHABET[unshifted_index],
        "turnover": [1 if turnover_active else 0],
    }


def format_ticked_sink_line(tick, module_id, value):
    return f"tick {tick} | {module_id}: {value}"
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

interface PythonExpressionContext {
  getInputExpression: (moduleId: string, portName: string) => string;
  getParamExpression: (
    moduleInstance: ModuleInstance,
    def: ModuleDefinition,
    key: string,
  ) => string;
}

interface CompositeExportDefinition {
  def: CompositeDef;
  functionName: string;
  stateful: boolean;
  inputArgNames: Map<string, string>;
  forwardedArgNames: Map<string, string>;
}

interface IteratorExportDefinition {
  moduleInstance: ModuleInstance;
  def: IteratorDef;
  roundDef: ModuleDefinition;
  functionName: string;
  resolvedIterationCount: number;
  stateful: boolean;
  inputArgNames: Map<string, string>;
}

function getModuleInstanceMap(project: Project) {
  return new Map(project.modules.map((moduleInstance) => [moduleInstance.id, moduleInstance]));
}

function buildPythonVariableMapForModules(modules: ModuleInstance[]) {
  const used = new Set<string>();
  const variables = new Map<string, string>();

  for (const moduleInstance of modules) {
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
  return buildPythonVariableMapForModules(project.modules);
}

function buildTopologicalOrder(project: Project, registry: ModuleRegistry): string[] {
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  for (const moduleInstance of project.modules) {
    adjacency.set(moduleInstance.id, []);
    indegree.set(moduleInstance.id, 0);
  }

  for (const connection of project.connections) {
    const targetInstance = project.modules.find((moduleInstance) => moduleInstance.id === connection.to.moduleId);
    const targetDef = targetInstance ? registry[targetInstance.defId] : null;
    if (connection.to.port === 'clock' && targetDef && isStatefulModule(targetDef)) {
      continue;
    }
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

function getClockConnectionMap(project: Project, registry: ModuleRegistry) {
  const clockConnections = new Map<string, ConnectionEndpoint>();

  for (const connection of project.connections) {
    const targetInstance = project.modules.find((moduleInstance) => moduleInstance.id === connection.to.moduleId);
    const targetDef = targetInstance ? registry[targetInstance.defId] : null;
    if (connection.to.port === 'clock' && targetDef && isStatefulModule(targetDef)) {
      clockConnections.set(connection.to.moduleId, connection.from);
    }
  }

  return clockConnections;
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

function resolveInputExpression(
  connectionsByTarget: Map<string, ConnectionEndpoint>,
  variablesByModuleId: Map<string, string>,
  inputExpressionOverrides: Map<string, string>,
  moduleId: string,
  portName: string,
) {
  const override = inputExpressionOverrides.get(`${moduleId}:${portName}`);
  if (override) {
    return override;
  }

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

function getDefaultParamExpression(
  moduleInstance: ModuleInstance,
  def: ModuleDefinition,
  key: string,
) {
  return toPythonLiteral(getResolvedParamValue(moduleInstance, def, key));
}

function createPythonExpressionContext(
  connectionsByTarget: Map<string, ConnectionEndpoint>,
  variablesByModuleId: Map<string, string>,
  inputExpressionOverrides = new Map<string, string>(),
  paramExpressionOverrides = new Map<string, string>(),
): PythonExpressionContext {
  return {
    getInputExpression: (moduleId, portName) =>
      resolveInputExpression(
        connectionsByTarget,
        variablesByModuleId,
        inputExpressionOverrides,
        moduleId,
        portName,
      ),
    getParamExpression: (moduleInstance, def, key) =>
      paramExpressionOverrides.get(`${moduleInstance.id}:${key}`)
      ?? getDefaultParamExpression(moduleInstance, def, key),
  };
}

function buildModuleExpression(
  moduleInstance: ModuleInstance,
  def: ModuleDefinition,
  expressionContext: PythonExpressionContext,
) {
  const moduleId = moduleInstance.id;

  switch (def.id) {
    case 'TextInput':
      return `text_input(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'KeyInput':
      return `key_input(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'AsciiSource':
      return `ascii_source(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'BitSource':
      return `bit_source(${expressionContext.getParamExpression(moduleInstance, def, 'stream')})`;
    case 'HexSource':
      return `hex_source(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'IV':
      return `protocol_material_source(${expressionContext.getParamExpression(moduleInstance, def, 'value')}, ${expressionContext.getParamExpression(moduleInstance, def, 'width')}, "IV")`;
    case 'Nonce':
      return `protocol_material_source(${expressionContext.getParamExpression(moduleInstance, def, 'value')}, ${expressionContext.getParamExpression(moduleInstance, def, 'width')}, "Nonce")`;
    case 'Salt':
      return `protocol_material_source(${expressionContext.getParamExpression(moduleInstance, def, 'value')}, ${expressionContext.getParamExpression(moduleInstance, def, 'width')}, "Salt")`;
    case 'SymbolToBits':
      return `symbol_to_bits(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'SymbolPermutation':
      return `symbol_permutation(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'order')})`;
    case 'SymbolWindow':
      return `symbol_window(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'start')}, ${expressionContext.getParamExpression(moduleInstance, def, 'width')})`;
    case 'Reflector':
      return `{"out": reflector_traverse(${expressionContext.getInputExpression(moduleId, 'in')}, _parse_reflector_wiring(${expressionContext.getParamExpression(moduleInstance, def, 'wiring')}))}`;
    case 'Plugboard':
      return `plugboard_eval(${expressionContext.getInputExpression(moduleId, 'in')}, _parse_plugboard_wiring(${expressionContext.getParamExpression(moduleInstance, def, 'wiring')}))`;
    case 'BitsToSymbol':
      return `bits_to_symbol(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'BitsToAscii':
      return `bits_to_ascii(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'BitsToBaudot':
      return `bits_to_baudot(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'BitsToHex':
      return `bits_to_hex(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'HexToAscii':
      return `hex_to_ascii(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'AsciiToHex':
      return `ascii_to_hex(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'XOR':
      return `xor_bits(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'AND':
      return `and_bits(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'OR':
      return `or_bits(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'NOT':
      return `not_bits(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'Gate':
      return `gate_bits(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'control')})`;
    case 'Equals':
      return `equals_bits(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'AtLeast':
      return `at_least_bits(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'Majority':
      return `majority_bits(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')}, ${expressionContext.getInputExpression(moduleId, 'c')})`;
    case 'GreaterThan':
      return `greater_than_bits(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'Mux':
      return `mux_bit(${expressionContext.getInputExpression(moduleId, 'select')}, ${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'Demux':
      return `demux_bit(${expressionContext.getInputExpression(moduleId, 'select')}, ${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'MultiRouter':
      return `multi_router(${expressionContext.getInputExpression(moduleId, 'select')}, ${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'routeCount')})`;
    case 'SBox':
      return `s_box(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'table')})`;
    case 'AddMod':
      return `add_mod(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'SubMod':
      return `sub_mod(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'Modulo':
      return `modulo_bits(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'modulus')})`;
    case 'MulMod':
      return `mul_mod(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'Permutation':
      return `permute_bits(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'order')})`;
    case 'ByteRotate':
      return `byte_rotate(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'amount')}, ${expressionContext.getParamExpression(moduleInstance, def, 'direction')})`;
    case 'ByteSwap':
      return `byte_swap(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'BitJoin':
      return `bit_join(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'BitSplit':
      return `bit_split(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'leftWidth')})`;
    case 'BitPad':
      return `bit_pad(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'targetWidth')}, ${expressionContext.getParamExpression(moduleInstance, def, 'side')}, ${expressionContext.getParamExpression(moduleInstance, def, 'padBit')})`;
    case 'BitUnpad':
      return `bit_unpad(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'originalWidth')}, ${expressionContext.getParamExpression(moduleInstance, def, 'side')})`;
    case 'BitWindow':
      return `bit_window(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'start')}, ${expressionContext.getParamExpression(moduleInstance, def, 'width')})`;
    case 'BitShifter':
      return `bit_shift(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'amount')}, ${expressionContext.getParamExpression(moduleInstance, def, 'mode')})`;
    default:
      throw new Error(`Python export does not support module "${def.id}".`);
  }
}

function buildSinkCaptureLine(
  moduleInstance: ModuleInstance,
  def: ModuleDefinition,
  expressionContext: PythonExpressionContext,
  indent = '    ',
) {
  const inputExpression = expressionContext.getInputExpression(moduleInstance.id, 'in');

  if (SYMBOL_SINK_DEF_IDS.has(def.id)) {
    return `${indent}sink_outputs.append((${JSON.stringify(moduleInstance.id)}, format_symbol_sink(${inputExpression})))`;
  }

  if (BIT_SINK_DEF_IDS.has(def.id)) {
    return `${indent}sink_outputs.append((${JSON.stringify(moduleInstance.id)}, format_bit_sink(${inputExpression})))`;
  }

  if (HEX_SINK_DEF_IDS.has(def.id)) {
    return `${indent}sink_outputs.append((${JSON.stringify(moduleInstance.id)}, format_hex_sink(${inputExpression})))`;
  }

  throw new Error(`Python export does not support sink "${def.id}".`);
}

function buildGeneratedModuleComment(
  moduleInstance: ModuleInstance,
  def: ModuleDefinition,
  indent: string,
  label = 'Module',
) {
  return `${indent}# ${label}: ${moduleInstance.id} [${def.id}]`;
}

function buildPythonNameMap(values: string[], prefix: string) {
  const used = new Set<string>();
  const mapping = new Map<string, string>();

  for (const value of values) {
    const base = sanitizeIdentifierPart(value);
    let candidate = `${prefix}_${base}`;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${prefix}_${base}_${suffix}`;
      suffix += 1;
    }
    used.add(candidate);
    mapping.set(value, candidate);
  }

  return mapping;
}

function getCompositeForwardedParamKeys(def: CompositeDef) {
  const keys: string[] = [];
  const seen = new Set<string>();

  for (const binding of def.forwardedParams ?? []) {
    if (seen.has(binding.externalParam)) {
      continue;
    }
    seen.add(binding.externalParam);
    keys.push(binding.externalParam);
  }

  return keys;
}

function getResolvedIteratorIterationCount(
  def: IteratorDef,
  params: Record<string, unknown>,
) {
  const override = params.iterationCount;
  if (typeof override === 'number' && Number.isInteger(override) && override > 0) {
    return override;
  }

  return def.iterationCount;
}

function applyForwardedCompositeParamsForExport(
  def: CompositeDef,
  params: Record<string, unknown>,
): Project {
  if (!def.forwardedParams?.length) {
    return def.project;
  }

  const forwardedByModuleId = new Map<string, Record<string, unknown>>();
  for (const binding of def.forwardedParams) {
    const value = params[binding.externalParam];
    if (value === undefined) {
      continue;
    }

    forwardedByModuleId.set(binding.internalModuleId, {
      ...(forwardedByModuleId.get(binding.internalModuleId) ?? {}),
      [binding.internalParamKey]: value,
    });
  }

  if (forwardedByModuleId.size === 0) {
    return def.project;
  }

  return {
    modules: def.project.modules.map((moduleInstance) => ({
      ...moduleInstance,
      params: forwardedByModuleId.has(moduleInstance.id)
        ? {
            ...moduleInstance.params,
            ...forwardedByModuleId.get(moduleInstance.id),
          }
        : moduleInstance.params,
    })),
    connections: def.project.connections,
  };
}

function projectHasStatefulExportCandidate(
  project: Project,
  registry: ModuleRegistry,
  compositeDepth = 0,
): boolean {
  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def) {
      continue;
    }

    if (isCompositeDefinition(def)) {
      if (compositeDepth >= 1) {
        continue;
      }
      const internalProject = applyForwardedCompositeParamsForExport(def, moduleInstance.params);
      if (projectHasStatefulExportCandidate(internalProject, registry, compositeDepth + 1)) {
        return true;
      }
      continue;
    }

    if (isIteratorDefinition(def)) {
      const roundDef = registry[def.roundDefId];
      if (roundDef && isCompositeDefinition(roundDef)) {
        if (projectHasStatefulExportCandidate(roundDef.project, registry, 1)) {
          return true;
        }
        continue;
      }
      if (
        roundDef &&
        !isIteratorDefinition(roundDef) &&
        SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS.has(roundDef.id)
      ) {
        return true;
      }
      continue;
    }

    if (SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS.has(def.id)) {
      return true;
    }
  }

  return false;
}

function derivePythonExportTickCount(
  project: Project,
  registry: ModuleRegistry,
  compositeDepth = 0,
): number | null {
  let minLength = deriveTickCount(project, registry);

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def || !isCompositeDefinition(def) || compositeDepth >= 1) {
      continue;
    }

    const internalProject = applyForwardedCompositeParamsForExport(def, moduleInstance.params);
    const internalTickCount = derivePythonExportTickCount(
      internalProject,
      registry,
      compositeDepth + 1,
    );
    if (internalTickCount === null) {
      continue;
    }
    if (minLength === null || internalTickCount < minLength) {
      minLength = internalTickCount;
    }
  }

  return minLength;
}

function collectPythonExportCompatibilityIssues(
  project: Project,
  registry: ModuleRegistry,
  scopePrefix = '',
  compositeDepth = 0,
): PythonExportCompatibilityIssue[] {
  const issues: PythonExportCompatibilityIssue[] = [];
  const hasStatefulSupportCandidate = projectHasStatefulExportCandidate(
    project,
    registry,
    compositeDepth,
  );

  for (const moduleInstance of project.modules) {
    const scopedModuleId = scopePrefix ? `${scopePrefix}/${moduleInstance.id}` : moduleInstance.id;
    const def = registry[moduleInstance.defId];
    if (!def) {
      issues.push({
        moduleId: scopedModuleId,
        defId: moduleInstance.defId,
        reason: 'Unknown module definition.',
      });
      continue;
    }

    if (moduleInstance.bypass) {
      issues.push({
        moduleId: scopedModuleId,
        defId: moduleInstance.defId,
        reason: 'Bypass behavior is not exportable in V1.',
      });
      continue;
    }

    if (isCompositeDefinition(def)) {
      if (compositeDepth >= 1) {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: 'Nested composite definitions are not exportable in V1.',
        });
        continue;
      }
      const internalProject = applyForwardedCompositeParamsForExport(def, moduleInstance.params);
      issues.push(
        ...collectPythonExportCompatibilityIssues(
          internalProject,
          registry,
          scopedModuleId,
          compositeDepth + 1,
        ),
      );
      continue;
    }

    if (isIteratorDefinition(def)) {
      if (compositeDepth > 0) {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: 'Iterators inside composites are not exportable in V1.',
        });
        continue;
      }

      const explicitOverride = moduleInstance.params.iterationCount;
      if (
        explicitOverride !== undefined &&
        !(typeof explicitOverride === 'number' && Number.isInteger(explicitOverride) && explicitOverride > 0)
      ) {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: 'Iterator iterationCount overrides must resolve to a positive integer.',
        });
      }

      const roundDef = registry[def.roundDefId];
      if (!roundDef) {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: `Iterator round definition "${def.roundDefId}" is unknown.`,
        });
        continue;
      }

      if (isIteratorDefinition(roundDef)) {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: 'Iterator round definitions that are themselves iterators are not exportable in V1.',
        });
        continue;
      }

      if (isCompositeDefinition(roundDef)) {
        const internalProject = applyForwardedCompositeParamsForExport(roundDef, {});
        issues.push(
          ...collectPythonExportCompatibilityIssues(
            internalProject,
            registry,
            `${scopedModuleId}/round-def`,
            1,
          ),
        );
        continue;
      }

      if (isStatefulModule(roundDef) && !SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS.has(roundDef.id)) {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: 'This iterator round definition is outside the Python export stateful supported subset.',
        });
        continue;
      }

      if (!SUPPORTED_PYTHON_EXPORT_DEF_IDS.has(roundDef.id)) {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: 'This iterator round definition is outside the Python export V1 supported subset.',
        });
      }
      continue;
    }

    if (isStatefulModule(def) && !SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS.has(def.id)) {
      issues.push({
        moduleId: scopedModuleId,
        defId: moduleInstance.defId,
        reason: 'This stateful or ticked primitive is outside the Python export stateful supported subset.',
      });
      continue;
    }

    if (!SUPPORTED_PYTHON_EXPORT_DEF_IDS.has(def.id)) {
      issues.push({
        moduleId: scopedModuleId,
        defId: moduleInstance.defId,
        reason: 'This primitive is outside the Python export V1 supported subset.',
      });
      continue;
    }

    if (
      hasStatefulSupportCandidate &&
      isTickSliceable(def) &&
      !SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS.has(def.id) &&
      !SUPPORTED_STATEFUL_PYTHON_EXPORT_COMPANION_DEF_IDS.has(def.id)
    ) {
      issues.push({
        moduleId: scopedModuleId,
        defId: moduleInstance.defId,
        reason: 'This tick-sliceable primitive is outside the Python export stateful companion subset.',
      });
    }

    if (def.id === 'RotorReverse') {
      const linkedRotorId =
        typeof moduleInstance.params.linkedRotorId === 'string'
          ? moduleInstance.params.linkedRotorId.trim()
          : '';
      if (!linkedRotorId) {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: 'RotorReverse requires a linked forward Rotor for Python export.',
        });
        continue;
      }

      const linkedModule = project.modules.find((candidate) => candidate.id === linkedRotorId);
      if (!linkedModule || linkedModule.defId !== 'Rotor') {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: `RotorReverse linkedRotorId must reference an exported forward Rotor, not "${linkedRotorId}".`,
        });
      }
    }
  }

  if (
    compositeDepth === 0 &&
    hasStatefulSupportCandidate &&
    derivePythonExportTickCount(project, registry, compositeDepth) === null
  ) {
    issues.push({
      moduleId: scopePrefix || 'project',
      defId: 'TickLoop',
      reason: 'Stateful Python export requires at least one tick-sliceable source to derive tick count.',
    });
  }

  return issues;
}

function collectCompositeExportDefinitions(
  project: Project,
  registry: ModuleRegistry,
): CompositeExportDefinition[] {
  const definitions = new Map<string, CompositeExportDefinition>();

  const registerCompositeDefinition = (def: CompositeDef) => {
    if (definitions.has(def.id)) {
      return;
    }

    const inputArgNames = buildPythonNameMap(
      def.inputs.map((input) => input.name),
      'input',
    );
    const forwardedArgNames = buildPythonNameMap(
      getCompositeForwardedParamKeys(def),
      'param',
    );

    definitions.set(def.id, {
      def,
      functionName: `composite_${sanitizeIdentifierPart(def.id)}`,
      stateful: projectHasStatefulExportCandidate(def.project, registry, 1),
      inputArgNames,
      forwardedArgNames,
    });
  };

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def) {
      continue;
    }

    if (isCompositeDefinition(def)) {
      registerCompositeDefinition(def);
      continue;
    }

    if (isIteratorDefinition(def)) {
      const roundDef = registry[def.roundDefId];
      if (roundDef && isCompositeDefinition(roundDef)) {
        registerCompositeDefinition(roundDef);
      }
    }
  }

  return Array.from(definitions.values()).sort((left, right) => left.def.id.localeCompare(right.def.id));
}

function buildCompositeInputExpressionOverrides(
  compositeDefinition: CompositeExportDefinition,
) {
  const overrides = new Map<string, string>();

  for (const binding of compositeDefinition.def.inputBindings) {
    const argumentName = compositeDefinition.inputArgNames.get(binding.externalPort);
    if (!argumentName) {
      throw new Error(`Python export could not resolve composite input "${binding.externalPort}".`);
    }
    overrides.set(`${binding.internalModuleId}:${binding.internalPort}`, argumentName);
  }

  return overrides;
}

function buildCompositeParamExpressionOverrides(
  compositeDefinition: CompositeExportDefinition,
) {
  const overrides = new Map<string, string>();

  for (const binding of compositeDefinition.def.forwardedParams ?? []) {
    const argumentName = compositeDefinition.forwardedArgNames.get(binding.externalParam);
    if (!argumentName) {
      throw new Error(`Python export could not resolve composite forwarded param "${binding.externalParam}".`);
    }
    overrides.set(`${binding.internalModuleId}:${binding.internalParamKey}`, argumentName);
  }

  return overrides;
}

function buildCompositeFunctionArgumentList(
  compositeDefinition: CompositeExportDefinition,
) {
  const inputArgs = compositeDefinition.def.inputs.map(
    (input) => compositeDefinition.inputArgNames.get(input.name) ?? sanitizeIdentifierPart(input.name),
  );
  const forwardedArgs = getCompositeForwardedParamKeys(compositeDefinition.def).map(
    (paramKey) => compositeDefinition.forwardedArgNames.get(paramKey) ?? sanitizeIdentifierPart(paramKey),
  );

  return {
    inputArgs,
    forwardedArgs,
    allArgs: [...inputArgs, ...forwardedArgs],
  };
}

function buildCompositeCallArguments(
  moduleInstance: ModuleInstance,
  compositeDefinition: CompositeExportDefinition,
  expressionContext: PythonExpressionContext,
) {
  const args: string[] = [];

  for (const input of compositeDefinition.def.inputs) {
    args.push(expressionContext.getInputExpression(moduleInstance.id, input.name));
  }

  for (const forwardedParamKey of getCompositeForwardedParamKeys(compositeDefinition.def)) {
    args.push(
      getDefaultParamExpression(moduleInstance, compositeDefinition.def, forwardedParamKey),
    );
  }

  return args;
}

function buildCompositeOutputReturnLine(
  compositeDefinition: CompositeExportDefinition,
  variablesByModuleId: Map<string, string>,
  indent: string,
) {
  const outputEntries = compositeDefinition.def.outputBindings.map((binding) => {
    const variableName = variablesByModuleId.get(binding.internalModuleId);
    if (!variableName) {
      throw new Error(`Python export could not resolve composite output module "${binding.internalModuleId}".`);
    }
    return `${JSON.stringify(binding.externalPort)}: ${variableName}[${JSON.stringify(binding.internalPort)}]`;
  });

  return `${indent}return {${outputEntries.join(', ')}}`;
}

function buildCompositeHelperDefinitions(
  compositeDefinitions: CompositeExportDefinition[],
  registry: ModuleRegistry,
) {
  const helperBlocks: string[] = [];

  for (const compositeDefinition of compositeDefinitions) {
    const internalProject = compositeDefinition.def.project;
    const order = buildTopologicalOrder(internalProject, registry);
    const instancesById = getModuleInstanceMap(internalProject);
    const variablesByModuleId = buildPythonVariableMap(internalProject);
    const connectionsByTarget = getInputConnectionMap(internalProject);
    const inputOverrides = buildCompositeInputExpressionOverrides(compositeDefinition);
    const paramOverrides = buildCompositeParamExpressionOverrides(compositeDefinition);
    const expressionContext = createPythonExpressionContext(
      connectionsByTarget,
      variablesByModuleId,
      inputOverrides,
      paramOverrides,
    );
    const args = buildCompositeFunctionArgumentList(compositeDefinition);

    if (!compositeDefinition.stateful) {
      const bodyLines: string[] = [
        `def ${compositeDefinition.functionName}(${args.allArgs.join(', ')}):`,
        `    # Composite helper: ${compositeDefinition.def.id}`,
      ];

      for (const moduleId of order) {
        const moduleInstance = instancesById.get(moduleId);
        if (!moduleInstance) {
          throw new Error(`Python export could not resolve composite module "${moduleId}".`);
        }
        const def = registry[moduleInstance.defId];
        if (!def || isCompositeDefinition(def) || isIteratorDefinition(def)) {
          throw new Error(`Python export encountered unsupported composite definition "${moduleInstance.defId}".`);
        }

        if (SYMBOL_SINK_DEF_IDS.has(def.id) || BIT_SINK_DEF_IDS.has(def.id) || HEX_SINK_DEF_IDS.has(def.id)) {
          bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '    ', 'Sink'));
          bodyLines.push('    pass');
          continue;
        }

        const variableName = variablesByModuleId.get(moduleId);
        if (!variableName) {
          throw new Error(`Python export could not resolve composite variable for "${moduleId}".`);
        }

        bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        bodyLines.push(
          `    ${variableName} = ${buildModuleExpression(moduleInstance, def, expressionContext)}`,
        );
      }

      bodyLines.push(buildCompositeOutputReturnLine(compositeDefinition, variablesByModuleId, '    '));
      helperBlocks.push(bodyLines.join('\n'));
      continue;
    }

    const initLines: string[] = [
      `def ${compositeDefinition.functionName}_init_state(${args.forwardedArgs.join(', ')}):`,
      `    # Composite state init: ${compositeDefinition.def.id}`,
      '    state = {}',
    ];

    for (const moduleInstance of internalProject.modules) {
      const def = registry[moduleInstance.defId];
      if (!def || isCompositeDefinition(def) || isIteratorDefinition(def)) {
        continue;
      }
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve composite state variable for "${moduleInstance.id}".`);
      }

      if (def.id === 'Counter') {
        initLines.push(
          buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
          `    state[${JSON.stringify(variableName)}] = counter_init(${expressionContext.getParamExpression(moduleInstance, def, 'width')}, ${expressionContext.getParamExpression(moduleInstance, def, 'value')}, ${expressionContext.getParamExpression(moduleInstance, def, 'step')})`,
        );
      } else if (def.id === 'LFSR') {
        initLines.push(
          buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
          `    state[${JSON.stringify(variableName)}] = lfsr_init(${expressionContext.getParamExpression(moduleInstance, def, 'seed')}, ${expressionContext.getParamExpression(moduleInstance, def, 'taps')}, ${expressionContext.getParamExpression(moduleInstance, def, 'outputLength')})`,
        );
      } else if (def.id === 'Rotor') {
        initLines.push(
          buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
          `    state[${JSON.stringify(variableName)}] = rotor_init(${expressionContext.getParamExpression(moduleInstance, def, 'wiring')}, ${expressionContext.getParamExpression(moduleInstance, def, 'position')}, ${expressionContext.getParamExpression(moduleInstance, def, 'ringOffset')}, ${expressionContext.getParamExpression(moduleInstance, def, 'notches')})`,
        );
      }
    }

    initLines.push('    return state');

    const tickLines: string[] = [
      `def ${compositeDefinition.functionName}_tick(state, tick${args.allArgs.length > 0 ? `, ${args.allArgs.join(', ')}` : ''}):`,
      `    # Composite helper: ${compositeDefinition.def.id}`,
    ];

    for (const moduleId of order) {
      const moduleInstance = instancesById.get(moduleId);
      if (!moduleInstance) {
        throw new Error(`Python export could not resolve composite module "${moduleId}".`);
      }
      const def = registry[moduleInstance.defId];
      if (!def || isCompositeDefinition(def) || isIteratorDefinition(def)) {
        throw new Error(`Python export encountered unsupported composite definition "${moduleInstance.defId}".`);
      }

      const variableName = variablesByModuleId.get(moduleId);
      if (!variableName) {
        throw new Error(`Python export could not resolve composite variable for "${moduleId}".`);
      }

      if (SYMBOL_SINK_DEF_IDS.has(def.id) || BIT_SINK_DEF_IDS.has(def.id) || HEX_SINK_DEF_IDS.has(def.id)) {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    ', 'Sink'));
        tickLines.push(`    ${variableName} = {}`);
        continue;
      }

      if (def.id === 'Clock') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = clock_tick(${expressionContext.getParamExpression(moduleInstance, def, 'period')}, ${expressionContext.getParamExpression(moduleInstance, def, 'offset')}, ${expressionContext.getParamExpression(moduleInstance, def, 'length')}, tick)`,
        );
        continue;
      }

      if (def.id === 'Counter') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(`    ${variableName} = counter_eval(state[${JSON.stringify(variableName)}])`);
        continue;
      }

      if (def.id === 'LFSR') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(`    ${variableName} = lfsr_eval(state[${JSON.stringify(variableName)}])`);
        continue;
      }

      if (def.id === 'Rotor') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = rotor_eval(${expressionContext.getInputExpression(moduleId, 'in')}, state[${JSON.stringify(variableName)}])`,
        );
        continue;
      }

      if (def.id === 'RotorReverse') {
        const linkedRotorId =
          typeof moduleInstance.params.linkedRotorId === 'string'
            ? moduleInstance.params.linkedRotorId.trim()
            : '';
        const linkedVariableName = variablesByModuleId.get(linkedRotorId);
        if (!linkedVariableName) {
          throw new Error(`Python export could not resolve linked forward rotor "${linkedRotorId}" for "${moduleInstance.id}".`);
        }
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = rotor_reverse_eval(${expressionContext.getInputExpression(moduleId, 'in')}, state[${JSON.stringify(linkedVariableName)}])`,
        );
        continue;
      }

      if (def.id === 'Reflector') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = {"out": reflector_traverse(${expressionContext.getInputExpression(moduleId, 'in')}, _parse_reflector_wiring(${expressionContext.getParamExpression(moduleInstance, def, 'wiring')}))}`,
        );
        continue;
      }

      if (def.id === 'Plugboard') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = plugboard_eval(${expressionContext.getInputExpression(moduleId, 'in')}, _parse_plugboard_wiring(${expressionContext.getParamExpression(moduleInstance, def, 'wiring')}))`,
        );
        continue;
      }

      if (def.id === 'BitSource') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = bit_source_tick(${expressionContext.getParamExpression(moduleInstance, def, 'stream')}, tick)`,
        );
        continue;
      }

      if (def.id === 'TextInput') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = text_input_tick(${expressionContext.getParamExpression(moduleInstance, def, 'value')}, tick)`,
        );
        continue;
      }

      tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
      tickLines.push(
        `    ${variableName} = ${buildModuleExpression(moduleInstance, def, expressionContext)}`,
      );
    }

    for (const moduleInstance of internalProject.modules) {
      const def = registry[moduleInstance.defId];
      if (!def || (def.id !== 'Counter' && def.id !== 'LFSR' && def.id !== 'Rotor')) {
        continue;
      }

      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve composite state variable for "${moduleInstance.id}".`);
      }

      const stepFlagName = `step_${variableName}`;
      const clockConnection = connectionsByTarget.get(`${moduleInstance.id}:clock`);
      tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    ', 'Advance flag'));
      if (!clockConnection) {
        tickLines.push(`    ${stepFlagName} = True`);
        continue;
      }

      tickLines.push(
        `    ${stepFlagName} = _is_active_control_pulse(${expressionContext.getInputExpression(moduleInstance.id, 'clock')})`,
      );
    }

    for (const moduleInstance of internalProject.modules) {
      const def = registry[moduleInstance.defId];
      if (!def || (def.id !== 'Counter' && def.id !== 'LFSR' && def.id !== 'Rotor')) {
        continue;
      }

      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve composite state variable for "${moduleInstance.id}".`);
      }

      const stepFlagName = `step_${variableName}`;
      tickLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'Advance'),
        `    if ${stepFlagName}:`,
        `        ${def.id === 'Counter' ? 'counter_advance' : def.id === 'LFSR' ? 'lfsr_advance' : 'rotor_advance'}(state[${JSON.stringify(variableName)}])`,
      );
    }

    tickLines.push(buildCompositeOutputReturnLine(compositeDefinition, variablesByModuleId, '    '));
    helperBlocks.push(initLines.join('\n'));
    helperBlocks.push(tickLines.join('\n'));
  }

  return helperBlocks;
}

function collectIteratorExportDefinitions(
  project: Project,
  registry: ModuleRegistry,
): IteratorExportDefinition[] {
  const definitions: IteratorExportDefinition[] = [];

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def || !isIteratorDefinition(def)) {
      continue;
    }

    const roundDef = registry[def.roundDefId];
    if (!roundDef || isIteratorDefinition(roundDef)) {
      continue;
    }

    definitions.push({
      moduleInstance,
      def,
      roundDef,
      functionName: `iterator_${sanitizeIdentifierPart(moduleInstance.id)}`,
      resolvedIterationCount: getResolvedIteratorIterationCount(def, moduleInstance.params),
      stateful: isCompositeDefinition(roundDef)
        ? projectHasStatefulExportCandidate(roundDef.project, registry, 1)
        : SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS.has(roundDef.id),
      inputArgNames: buildPythonNameMap(
        def.inputs.map((input) => input.name),
        'input',
      ),
    });
  }

  return definitions.sort((left, right) =>
    left.moduleInstance.id.localeCompare(right.moduleInstance.id),
  );
}

function buildIteratorFunctionArgumentList(
  iteratorDefinition: IteratorExportDefinition,
) {
  const inputArgs = iteratorDefinition.def.inputs.map(
    (input) =>
      iteratorDefinition.inputArgNames.get(input.name) ?? sanitizeIdentifierPart(input.name),
  );

  return {
    inputArgs,
    allArgs: inputArgs,
  };
}

function buildIteratorCallArguments(
  iteratorDefinition: IteratorExportDefinition,
  expressionContext: PythonExpressionContext,
) {
  return iteratorDefinition.def.inputs.map((input) =>
    expressionContext.getInputExpression(iteratorDefinition.moduleInstance.id, input.name),
  );
}

function buildIteratorRoundExpression(
  iteratorDefinition: IteratorExportDefinition,
  roundDef: ModuleDefinition,
  roundModuleId: string,
  roundInputExpression: string,
  roundKeyExpression: string | null,
  compositeDefinitionsById: Map<string, CompositeExportDefinition>,
) {
  if (isCompositeDefinition(roundDef)) {
    const compositeDefinition = compositeDefinitionsById.get(roundDef.id);
    if (!compositeDefinition) {
      throw new Error(`Python export could not resolve composite round helper for "${roundDef.id}".`);
    }

    const args = roundDef.inputs.map((input) => {
      if (input.name === 'in') {
        return roundInputExpression;
      }
      if (input.name === 'key') {
        if (!roundKeyExpression) {
          throw new Error(`Python export could not resolve keyed iterator input for "${iteratorDefinition.def.id}".`);
        }
        return roundKeyExpression;
      }
      throw new Error(`Python export does not support iterator round input "${input.name}" for "${iteratorDefinition.def.id}".`);
    });

    for (const forwardedParamKey of getCompositeForwardedParamKeys(roundDef)) {
      args.push(
        getDefaultParamExpression(
          { id: roundModuleId, defId: roundDef.id, params: {} },
          roundDef,
          forwardedParamKey,
        ),
      );
    }

    return `${compositeDefinition.functionName}(${args.join(', ')})`;
  }

  const roundInputOverrides = new Map<string, string>([[`${roundModuleId}:in`, roundInputExpression]]);
  if (roundKeyExpression) {
    roundInputOverrides.set(`${roundModuleId}:key`, roundKeyExpression);
  }

  const roundExpressionContext = createPythonExpressionContext(
    new Map<string, ConnectionEndpoint>(),
    new Map<string, string>(),
    roundInputOverrides,
  );

  return buildModuleExpression(
    { id: roundModuleId, defId: roundDef.id, params: {} },
    roundDef,
    roundExpressionContext,
  );
}

function buildIteratorHelperDefinitions(
  iteratorDefinitions: IteratorExportDefinition[],
  compositeDefinitionsById: Map<string, CompositeExportDefinition>,
) {
  const helperBlocks: string[] = [];

  for (const iteratorDefinition of iteratorDefinitions) {
    const args = buildIteratorFunctionArgumentList(iteratorDefinition);
    const inputName = iteratorDefinition.inputArgNames.get('in');
    if (!inputName) {
      throw new Error(`Python export requires iterator "${iteratorDefinition.def.id}" to expose an "in" input.`);
    }

    const roundDef = iteratorDefinition.roundDef;
    const keyInputName = iteratorDefinition.inputArgNames.get('key') ?? null;
    const keyBitsName = keyInputName ? `${sanitizeIdentifierPart(keyInputName)}_bits` : null;

    if (!iteratorDefinition.stateful) {
      const bodyLines: string[] = [
        `def ${iteratorDefinition.functionName}(${args.allArgs.join(', ')}):`,
        `    # Iterator helper: ${iteratorDefinition.def.id} [${iteratorDefinition.moduleInstance.id}]`,
      ];

      if (iteratorDefinition.def.roundKeyWidth !== undefined) {
        if (!keyInputName || !keyBitsName) {
          throw new Error(`Python export requires keyed iterator "${iteratorDefinition.def.id}" to expose a "key" input.`);
        }
        const expectedWidth = iteratorDefinition.resolvedIterationCount * iteratorDefinition.def.roundKeyWidth;
        bodyLines.push(
          `    ${keyBitsName} = _expect_bits(${keyInputName}, ${JSON.stringify(iteratorDefinition.def.id)})`,
          `    if len(${keyBitsName}) != ${expectedWidth}:`,
          `        raise ValueError(${JSON.stringify(`Iterator "${iteratorDefinition.def.id}" requires a key bus of exactly ${expectedWidth} bits.`)})`,
        );
      }

      let previousRoundExpression = inputName;
      for (let index = 0; index < iteratorDefinition.resolvedIterationCount; index += 1) {
        const roundNumber = index + 1;
        const roundModuleId = `round-${roundNumber}`;
        const roundVariableName = `round_${roundNumber}`;
        const roundKeyExpression =
          iteratorDefinition.def.roundKeyWidth !== undefined && keyBitsName
            ? `${keyBitsName}[${index * iteratorDefinition.def.roundKeyWidth}:${(index + 1) * iteratorDefinition.def.roundKeyWidth}]`
            : null;
        bodyLines.push(
          `    # Round ${roundNumber}: ${iteratorDefinition.def.roundDefId}`,
          `    ${roundVariableName} = ${buildIteratorRoundExpression(
            iteratorDefinition,
            roundDef,
            roundModuleId,
            previousRoundExpression,
            roundKeyExpression,
            compositeDefinitionsById,
          )}`,
        );
        previousRoundExpression = `${roundVariableName}["out"]`;
      }

      bodyLines.push(`    return {"out": ${previousRoundExpression}}`);
      helperBlocks.push(bodyLines.join('\n'));
      continue;
    }

    const initLines: string[] = [
      `def ${iteratorDefinition.functionName}_init_state():`,
      `    # Iterator state init: ${iteratorDefinition.def.id} [${iteratorDefinition.moduleInstance.id}]`,
      '    state = {}',
    ];

    for (let index = 0; index < iteratorDefinition.resolvedIterationCount; index += 1) {
      const roundNumber = index + 1;
      const roundModuleId = `round-${roundNumber}`;
      const roundStateKey = `round_${roundNumber}`;
      initLines.push(
        `    # State init: ${roundModuleId} [${roundDef.id}]`,
      );

      if (isCompositeDefinition(roundDef)) {
        const compositeDefinition = compositeDefinitionsById.get(roundDef.id);
        if (!compositeDefinition) {
          throw new Error(`Python export could not resolve stateful composite round helper for "${roundDef.id}".`);
        }
        const forwardedArgs = getCompositeForwardedParamKeys(roundDef).map((paramKey) =>
          getDefaultParamExpression(
            { id: roundModuleId, defId: roundDef.id, params: {} },
            roundDef,
            paramKey,
          ),
        );
        initLines.push(
          `    state[${JSON.stringify(roundStateKey)}] = ${compositeDefinition.functionName}_init_state(${forwardedArgs.join(', ')})`,
        );
        continue;
      }

      if (roundDef.id === 'Rotor') {
        initLines.push(
          `    state[${JSON.stringify(roundStateKey)}] = rotor_init(${toPythonLiteral(getResolvedParamValue({ id: roundModuleId, defId: roundDef.id, params: {} }, roundDef, 'wiring'))}, ${toPythonLiteral(getResolvedParamValue({ id: roundModuleId, defId: roundDef.id, params: {} }, roundDef, 'position'))}, ${toPythonLiteral(getResolvedParamValue({ id: roundModuleId, defId: roundDef.id, params: {} }, roundDef, 'ringOffset'))}, ${toPythonLiteral(getResolvedParamValue({ id: roundModuleId, defId: roundDef.id, params: {} }, roundDef, 'notches'))})`,
        );
        continue;
      }

      throw new Error(`Python export does not support temporal iterator round "${roundDef.id}".`);
    }

    initLines.push('    return state');

    const tickLines: string[] = [
      `def ${iteratorDefinition.functionName}_tick(state, tick${args.allArgs.length > 0 ? `, ${args.allArgs.join(', ')}` : ''}):`,
      `    # Iterator helper: ${iteratorDefinition.def.id} [${iteratorDefinition.moduleInstance.id}]`,
    ];

    let previousRoundExpression = inputName;
    for (let index = 0; index < iteratorDefinition.resolvedIterationCount; index += 1) {
      const roundNumber = index + 1;
      const roundStateKey = `round_${roundNumber}`;
      const roundVariableName = `round_${roundNumber}`;
      const roundKeyExpression =
        iteratorDefinition.def.roundKeyWidth !== undefined && keyBitsName
          ? `${keyBitsName}[${index * iteratorDefinition.def.roundKeyWidth}:${(index + 1) * iteratorDefinition.def.roundKeyWidth}]`
          : null;

      if (isCompositeDefinition(roundDef)) {
        const compositeDefinition = compositeDefinitionsById.get(roundDef.id);
        if (!compositeDefinition) {
          throw new Error(`Python export could not resolve stateful composite round helper for "${roundDef.id}".`);
        }
        const roundArgs = roundDef.inputs.map((input) => {
          if (input.name === 'in') {
            return previousRoundExpression;
          }
          if (input.name === 'key') {
            if (!roundKeyExpression) {
              throw new Error(`Python export could not resolve keyed iterator input for "${iteratorDefinition.def.id}".`);
            }
            return roundKeyExpression;
          }
          throw new Error(`Python export does not support iterator round input "${input.name}" for "${iteratorDefinition.def.id}".`);
        });
        for (const forwardedParamKey of getCompositeForwardedParamKeys(roundDef)) {
          roundArgs.push(
            getDefaultParamExpression(
              { id: `round-${roundNumber}`, defId: roundDef.id, params: {} },
              roundDef,
              forwardedParamKey,
            ),
          );
        }
        tickLines.push(
          `    # Round ${roundNumber}: ${iteratorDefinition.def.roundDefId}`,
          `    ${roundVariableName} = ${compositeDefinition.functionName}_tick(state[${JSON.stringify(roundStateKey)}], tick${roundArgs.length > 0 ? `, ${roundArgs.join(', ')}` : ''})`,
        );
        previousRoundExpression = `${roundVariableName}["out"]`;
        continue;
      }

      tickLines.push(
        `    # Round ${roundNumber}: ${iteratorDefinition.def.roundDefId}`,
        `    ${roundVariableName} = rotor_eval(${previousRoundExpression}, state[${JSON.stringify(roundStateKey)}])`,
      );
      previousRoundExpression = `${roundVariableName}["out"]`;
    }

    if (iteratorDefinition.def.roundKeyWidth !== undefined) {
      if (!keyInputName || !keyBitsName) {
        throw new Error(`Python export requires keyed iterator "${iteratorDefinition.def.id}" to expose a "key" input.`);
      }
      const expectedWidth = iteratorDefinition.resolvedIterationCount * iteratorDefinition.def.roundKeyWidth;
      tickLines.splice(2, 0,
        `    ${keyBitsName} = _expect_bits(${keyInputName}, ${JSON.stringify(iteratorDefinition.def.id)})`,
        `    if len(${keyBitsName}) != ${expectedWidth}:`,
        `        raise ValueError(${JSON.stringify(`Iterator "${iteratorDefinition.def.id}" requires a key bus of exactly ${expectedWidth} bits.`)})`,
      );
    }

    if (isCompositeDefinition(roundDef)) {
      tickLines.push(`    return {"out": ${previousRoundExpression}}`);
      helperBlocks.push(initLines.join('\n'));
      helperBlocks.push(tickLines.join('\n'));
      continue;
    }

    for (let index = 0; index < iteratorDefinition.resolvedIterationCount; index += 1) {
      const roundNumber = index + 1;
      const roundVariableName = `round_${roundNumber}`;
      tickLines.push(
        `    # Advance flag: round-${roundNumber} [${roundDef.id}]`,
        `    step_${roundVariableName} = True`,
      );
    }

    for (let index = 0; index < iteratorDefinition.resolvedIterationCount; index += 1) {
      const roundNumber = index + 1;
      const roundVariableName = `round_${roundNumber}`;
      const roundStateKey = `round_${roundNumber}`;
      tickLines.push(
        `    # Advance: round-${roundNumber} [${roundDef.id}]`,
        `    if step_${roundVariableName}:`,
        `        rotor_advance(state[${JSON.stringify(roundStateKey)}])`,
      );
    }

    tickLines.push(`    return {"out": ${previousRoundExpression}}`);
    helperBlocks.push(initLines.join('\n'));
    helperBlocks.push(tickLines.join('\n'));
  }

  return helperBlocks;
}

export function getPythonExportCompatibility(
  project: Project,
  registry: ModuleRegistry,
): PythonExportCompatibilityResult {
  const issues = collectPythonExportCompatibilityIssues(project, registry);

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

  const compositeDefinitions = collectCompositeExportDefinitions(project, registry);
  const compositeDefinitionsById = new Map(
    compositeDefinitions.map((definition) => [definition.def.id, definition]),
  );
  const iteratorDefinitions = collectIteratorExportDefinitions(project, registry);
  const iteratorDefinitionsByModuleId = new Map(
    iteratorDefinitions.map((definition) => [definition.moduleInstance.id, definition]),
  );
  const helperBlocks = [
    ...buildCompositeHelperDefinitions(compositeDefinitions, registry),
    ...buildIteratorHelperDefinitions(iteratorDefinitions, compositeDefinitionsById),
  ];
  const hasStatefulModules = projectHasStatefulExportCandidate(project, registry);

  if (hasStatefulModules) {
    return generateStatefulPythonExport(
      project,
      registry,
      compositeDefinitionsById,
      iteratorDefinitionsByModuleId,
      helperBlocks,
    );
  }

  const order = buildTopologicalOrder(project, registry);
  const instancesById = getModuleInstanceMap(project);
  const variablesByModuleId = buildPythonVariableMap(project);
  const connectionsByTarget = getInputConnectionMap(project);
  const expressionContext = createPythonExpressionContext(
    connectionsByTarget,
    variablesByModuleId,
  );
  const bodyLines: string[] = ['def run():', '    sink_outputs = []'];

  for (const moduleId of order) {
    const moduleInstance = instancesById.get(moduleId);
    if (!moduleInstance) {
      throw new Error(`Python export could not resolve module "${moduleId}".`);
    }

    const def = registry[moduleInstance.defId];
    if (!def) {
      throw new Error(`Python export encountered unsupported definition "${moduleInstance.defId}".`);
    }

    if (SYMBOL_SINK_DEF_IDS.has(def.id) || BIT_SINK_DEF_IDS.has(def.id) || HEX_SINK_DEF_IDS.has(def.id)) {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '    ', 'Sink'));
      bodyLines.push(buildSinkCaptureLine(moduleInstance, def, expressionContext));
      continue;
    }

    const variableName = variablesByModuleId.get(moduleId);
    if (!variableName) {
      throw new Error(`Python export could not resolve a variable for "${moduleId}".`);
    }

    if (isCompositeDefinition(def)) {
      const compositeDefinition = compositeDefinitionsById.get(def.id);
      if (!compositeDefinition) {
        throw new Error(`Python export could not resolve composite helper for "${def.id}".`);
      }
      const callArguments = buildCompositeCallArguments(
        moduleInstance,
        compositeDefinition,
        expressionContext,
      );
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
      bodyLines.push(
        `    ${variableName} = ${compositeDefinition.functionName}(${callArguments.join(', ')})`,
      );
      continue;
    }

    if (isIteratorDefinition(def)) {
      const iteratorDefinition = iteratorDefinitionsByModuleId.get(moduleInstance.id);
      if (!iteratorDefinition) {
        throw new Error(`Python export could not resolve iterator helper for "${moduleInstance.id}".`);
      }
      const callArguments = buildIteratorCallArguments(
        iteratorDefinition,
        expressionContext,
      );
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
      bodyLines.push(
        `    ${variableName} = ${iteratorDefinition.functionName}(${callArguments.join(', ')})`,
      );
      continue;
    }

    bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
    bodyLines.push(
      `    ${variableName} = ${buildModuleExpression(moduleInstance, def, expressionContext)}`,
    );
  }

  bodyLines.push('    return sink_outputs', '', 'def main():', '    for module_id, value in run():', '        print(f"{module_id}: {value}")', '', 'if __name__ == "__main__":', '    main()');

  const helperPrefix = helperBlocks.length > 0 ? `${helperBlocks.join('\n\n')}\n\n` : '';

  return `${PYTHON_RUNTIME}\n\n${helperPrefix}${bodyLines.join('\n')}\n`;
}

function generateStatefulPythonExport(
  project: Project,
  registry: ModuleRegistry,
  compositeDefinitionsById: Map<string, CompositeExportDefinition>,
  iteratorDefinitionsByModuleId: Map<string, IteratorExportDefinition>,
  helperBlocks: string[],
) {
  const tickCount = derivePythonExportTickCount(project, registry);
  if (tickCount === null) {
    throw new Error('Stateful Python export requires at least one tick-sliceable source.');
  }

  const order = buildTopologicalOrder(project, registry);
  const instancesById = getModuleInstanceMap(project);
  const variablesByModuleId = buildPythonVariableMap(project);
  const connectionsByTarget = getInputConnectionMap(project);
  const clockConnectionsByModuleId = getClockConnectionMap(project, registry);
  const expressionContext = createPythonExpressionContext(
    connectionsByTarget,
    variablesByModuleId,
  );
  const bodyLines: string[] = ['def run_ticks():', `    tick_count = ${tickCount}`, '    sink_output_lines = []'];

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def) {
      continue;
    }

    if (isCompositeDefinition(def)) {
      const compositeDefinition = compositeDefinitionsById.get(def.id);
      if (!compositeDefinition || !compositeDefinition.stateful) {
        continue;
      }
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      const forwardedArgs = getCompositeForwardedParamKeys(def).map((paramKey) =>
        getDefaultParamExpression(moduleInstance, def, paramKey),
      );
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = ${compositeDefinition.functionName}_init_state(${forwardedArgs.join(', ')})`,
      );
      continue;
    }

    if (isIteratorDefinition(def)) {
      const iteratorDefinition = iteratorDefinitionsByModuleId.get(moduleInstance.id);
      if (!iteratorDefinition || !iteratorDefinition.stateful) {
        continue;
      }
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = ${iteratorDefinition.functionName}_init_state()`,
      );
      continue;
    }

    if (def.id === 'Counter') {
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = counter_init(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'width'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'value'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'step'))})`,
      );
      continue;
    }

    if (def.id === 'LFSR') {
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = lfsr_init(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'seed'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'taps'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'outputLength'))})`,
      );
      continue;
    }

    if (def.id === 'Rotor') {
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = rotor_init(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'wiring'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'position'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'ringOffset'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'notches'))})`,
      );
      continue;
    }
  }

  bodyLines.push('', '    for tick in range(tick_count):');

  for (const moduleId of order) {
    const moduleInstance = instancesById.get(moduleId);
    if (!moduleInstance) {
      throw new Error(`Python export could not resolve module "${moduleId}".`);
    }

    const def = registry[moduleInstance.defId];
    if (!def) {
      throw new Error(`Python export encountered unsupported definition "${moduleInstance.defId}".`);
    }

    if (SYMBOL_SINK_DEF_IDS.has(def.id) || BIT_SINK_DEF_IDS.has(def.id) || HEX_SINK_DEF_IDS.has(def.id)) {
      const inputExpression = expressionContext.getInputExpression(moduleInstance.id, 'in');
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        ', 'Sink'));
      if (SYMBOL_SINK_DEF_IDS.has(def.id)) {
        bodyLines.push(`        sink_output_lines.append(format_ticked_sink_line(tick, ${JSON.stringify(moduleInstance.id)}, format_symbol_sink(${inputExpression})))`);
      } else if (BIT_SINK_DEF_IDS.has(def.id)) {
        bodyLines.push(`        sink_output_lines.append(format_ticked_sink_line(tick, ${JSON.stringify(moduleInstance.id)}, format_bit_sink(${inputExpression})))`);
      } else {
        bodyLines.push(`        sink_output_lines.append(format_ticked_sink_line(tick, ${JSON.stringify(moduleInstance.id)}, format_hex_sink(${inputExpression})))`);
      }
      continue;
    }

    const variableName = variablesByModuleId.get(moduleId);
    if (!variableName) {
      throw new Error(`Python export could not resolve a variable for "${moduleId}".`);
    }

    if (isCompositeDefinition(def)) {
      const compositeDefinition = compositeDefinitionsById.get(def.id);
      if (!compositeDefinition) {
        throw new Error(`Python export could not resolve composite helper for "${def.id}".`);
      }
      const callArguments = buildCompositeCallArguments(
        moduleInstance,
        compositeDefinition,
        expressionContext,
      );
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      if (compositeDefinition.stateful) {
        bodyLines.push(
          `        ${variableName} = ${compositeDefinition.functionName}_tick(${variableName}_state, tick${callArguments.length > 0 ? `, ${callArguments.join(', ')}` : ''})`,
        );
      } else {
        bodyLines.push(
          `        ${variableName} = ${compositeDefinition.functionName}(${callArguments.join(', ')})`,
        );
      }
      continue;
    }

    if (isIteratorDefinition(def)) {
      const iteratorDefinition = iteratorDefinitionsByModuleId.get(moduleInstance.id);
      if (!iteratorDefinition) {
        throw new Error(`Python export could not resolve iterator helper for "${moduleInstance.id}".`);
      }
      const callArguments = buildIteratorCallArguments(
        iteratorDefinition,
        expressionContext,
      );
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      if (iteratorDefinition.stateful) {
        bodyLines.push(
          `        ${variableName} = ${iteratorDefinition.functionName}_tick(${variableName}_state, tick${callArguments.length > 0 ? `, ${callArguments.join(', ')}` : ''})`,
        );
      } else {
        bodyLines.push(
          `        ${variableName} = ${iteratorDefinition.functionName}(${callArguments.join(', ')})`,
        );
      }
      continue;
    }

    if (def.id === 'Clock') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = clock_tick(${expressionContext.getParamExpression(moduleInstance, def, 'period')}, ${expressionContext.getParamExpression(moduleInstance, def, 'offset')}, ${expressionContext.getParamExpression(moduleInstance, def, 'length')}, tick)`,
      );
      continue;
    }

    if (def.id === 'Counter') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(`        ${variableName} = counter_eval(${variableName}_state)`);
      continue;
    }

    if (def.id === 'LFSR') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(`        ${variableName} = lfsr_eval(${variableName}_state)`);
      continue;
    }

    if (def.id === 'Rotor') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = rotor_eval(${expressionContext.getInputExpression(moduleId, 'in')}, ${variableName}_state)`,
      );
      continue;
    }

    if (def.id === 'RotorReverse') {
      const linkedRotorId =
        typeof moduleInstance.params.linkedRotorId === 'string'
          ? moduleInstance.params.linkedRotorId.trim()
          : '';
      const linkedVariableName = variablesByModuleId.get(linkedRotorId);
      if (!linkedVariableName) {
        throw new Error(`Python export could not resolve linked forward rotor "${linkedRotorId}" for "${moduleInstance.id}".`);
      }
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = rotor_reverse_eval(${expressionContext.getInputExpression(moduleId, 'in')}, ${linkedVariableName}_state)`,
      );
      continue;
    }

    if (def.id === 'Reflector') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = {"out": reflector_traverse(${expressionContext.getInputExpression(moduleId, 'in')}, _parse_reflector_wiring(${expressionContext.getParamExpression(moduleInstance, def, 'wiring')}))}`,
      );
      continue;
    }

    if (def.id === 'Plugboard') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = plugboard_eval(${expressionContext.getInputExpression(moduleId, 'in')}, _parse_plugboard_wiring(${expressionContext.getParamExpression(moduleInstance, def, 'wiring')}))`,
      );
      continue;
    }

    if (def.id === 'BitSource') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = bit_source_tick(${expressionContext.getParamExpression(moduleInstance, def, 'stream')}, tick)`,
      );
      continue;
    }

    if (def.id === 'TextInput') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = text_input_tick(${expressionContext.getParamExpression(moduleInstance, def, 'value')}, tick)`,
      );
      continue;
    }

    bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
    bodyLines.push(
      `        ${variableName} = ${buildModuleExpression(moduleInstance, def, expressionContext)}`,
    );
  }

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def || (def.id !== 'Counter' && def.id !== 'LFSR' && def.id !== 'Rotor')) {
      continue;
    }

    const variableName = variablesByModuleId.get(moduleInstance.id);
    if (!variableName) {
      throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
    }

    const stepFlagName = `step_${variableName}`;
    const clockConnection = clockConnectionsByModuleId.get(moduleInstance.id);
    bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        ', 'Advance flag'));
    if (!clockConnection) {
      bodyLines.push(`        ${stepFlagName} = True`);
      continue;
    }

    const upstreamVariable = variablesByModuleId.get(clockConnection.moduleId);
    if (!upstreamVariable) {
      throw new Error(`Python export could not resolve module "${clockConnection.moduleId}".`);
    }

    bodyLines.push(
      `        ${stepFlagName} = _is_active_control_pulse(${upstreamVariable}[${JSON.stringify(clockConnection.port)}])`,
    );
  }

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def || (def.id !== 'Counter' && def.id !== 'LFSR' && def.id !== 'Rotor')) {
      continue;
    }

    const variableName = variablesByModuleId.get(moduleInstance.id);
    if (!variableName) {
      throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
    }

    const stepFlagName = `step_${variableName}`;
    bodyLines.push(
      buildGeneratedModuleComment(moduleInstance, def, '        ', 'Advance'),
      `        if ${stepFlagName}:`,
      `            ${def.id === 'Counter' ? 'counter_advance' : def.id === 'LFSR' ? 'lfsr_advance' : 'rotor_advance'}(${variableName}_state)`,
    );
  }

  bodyLines.push('', '    return sink_output_lines', '', 'def main():', '    for line in run_ticks():', '        print(line)', '', 'if __name__ == "__main__":', '    main()');

  const helperPrefix = helperBlocks.length > 0 ? `${helperBlocks.join('\n\n')}\n\n` : '';

  return `${PYTHON_RUNTIME}\n\n${helperPrefix}${bodyLines.join('\n')}\n`;
}
