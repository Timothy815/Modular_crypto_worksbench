import {
  isCompositeDefinition,
  isIteratorDefinition,
  type CompositeDef,
  type IteratorDef,
} from '../composites';
import { deriveTickCount, executeProject, executeTickedProject } from '../executor';
import type {
  ConnectionEndpoint,
  ExecutionResult,
  Signal,
  TickedExecutionResult,
  ModuleDefinition,
  ModuleInstance,
  ModuleRegistry,
  Project,
} from '../types';
import { isStatefulModule, isTickSliceable, usesClockAsInput } from '../types';
import { validateProject } from '../validation';

const SUPPORTED_PYTHON_EXPORT_DEF_IDS = new Set([
  'TextInput',
  'KeyInput',
  'AsciiSequenceInput',
  'AsciiSequenceToBits',
  'AsciiSequenceToTicked',
  'SymbolSequenceInput',
  'BitSequenceInput',
  'AsciiSource',
  'AsciiCharToBits',
  'BaudotSource',
  'BitSource',
  'ConstantBit',
  'HexSource',
  'HexSequenceInput',
  'HexSequenceToBits',
  'HexDigitToBits',
  'IV',
  'Nonce',
  'Salt',
  'Output',
  'TextOutput',
  'BitsToAscii',
  'BitsToAsciiChar',
  'BitsToBaudot',
  'BitOutput',
  'HexOutput',
  'BaudotOutput',
  'SymbolPermutation',
  'SymbolWindow',
  'RepeatSymbolToLength',
  'PadSymbolToMatch',
  'RequireSymbolLengthMatch',
  'TruncateSymbolSequence',
  'TruncateSymbolToMatch',
  'SymbolToBits',
  'BitsToSymbol',
  'PolluxFractionation',
  'PolluxControlledFractionation',
  'PolluxInverse',
  'BitsToHex',
  'BitsToHexDigit',
  'HexToAscii',
  'AsciiToHex',
  'RepeatSymbolToMatch',
  'XOR',
  'AND',
  'OR',
  'NOT',
  'Gate',
  'Equals',
  'AtLeast',
  'ModExp',
  'ModInverse',
  'Mux',
  'Demux',
  'MultiRouter',
  'MultiSelector',
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
  'BitSelect',
  'BitExpand',
  'RepeatBitsToLength',
  'RepeatBitsToMatch',
  'PadBitsToMatch',
  'RequireBitsLengthMatch',
  'BroadcastBits',
  'TruncateBitsSequence',
  'TruncateBitsToMatch',
  'PadBitsSequence',
  'BitShifter',
  'Clock',
  'Counter',
  'LFSR',
  'Rotor',
  'Reflector',
  'RotorReverse',
  'Plugboard',
  'SymbolSequenceToTicked',
  'TickedSymbolsToSequence',
  'TickedBitsToSequence',
  'BitsSequenceToTicked',
]);

const SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS = new Set([
  'Clock',
  'Counter',
  'LFSR',
  'Rotor',
  'RotorReverse',
  'TickedSymbolsToSequence',
  'TickedBitsToSequence',
  'AsciiSequenceToTicked',
  'SymbolSequenceToTicked',
  'BitsSequenceToTicked',
]);
const SUPPORTED_STATEFUL_PYTHON_EXPORT_COMPANION_DEF_IDS = new Set([
  'TextInput',
  'AsciiSequenceInput',
  'AsciiSequenceToBits',
  'SymbolSequenceInput',
  'BitSequenceInput',
  'BitSource',
  'HexSequenceInput',
  'BaudotSource',
  'BitOutput',
  'Output',
  'TextOutput',
  'HexOutput',
  'BitsToHex',
  'KeyInput',
  'RepeatSymbolToLength',
  'RepeatBitsToLength',
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

const PYTHON_RUNTIME_VERSION = '1.0.0';

const PYTHON_RUNTIME_PUBLIC_EXPORT_NAMES = [
  'ALPHABET',
  'ROTOR_SIZE',
  'text_input',
  'text_input_tick',
  'ascii_sequence_input',
  'ascii_sequence_to_bits',
  'ascii_char_to_bits',
  'symbol_sequence_input',
  'bit_sequence_input',
  'key_input',
  'ascii_source',
  'baudot_source',
  'baudot_source_tick',
  'bit_source',
  'constant_bit',
  'bit_source_tick',
  'hex_source',
  'hex_sequence_input',
  'hex_sequence_to_bits',
  'protocol_material_source',
  'symbol_to_bits',
  'bits_to_symbol',
  'bits_to_ascii',
  'bits_to_ascii_char',
  'bits_to_baudot',
  'bits_to_hex',
  'bits_to_hex_digit',
  'hex_digit_to_bits',
  'hex_to_ascii',
  'ascii_to_hex',
  'symbol_permutation',
  'symbol_window',
  'repeat_symbol_to_length',
  'pad_symbol_to_match',
  'repeat_symbol_to_match',
  'truncate_symbol_to_match',
  'truncate_symbol_sequence',
  'ascii_sequence_to_ticked_init',
  'ascii_sequence_to_ticked_eval',
  'ascii_sequence_to_ticked_advance',
  'ticked_symbols_to_sequence_init',
  'ticked_symbols_to_sequence_eval',
  'ticked_symbols_to_sequence_advance',
  'symbol_sequence_to_ticked_init',
  'symbol_sequence_to_ticked_eval',
  'symbol_sequence_to_ticked_advance',
  'ticked_bits_to_sequence_init',
  'ticked_bits_to_sequence_eval',
  'ticked_bits_to_sequence_advance',
  'bits_sequence_to_ticked_init',
  'bits_sequence_to_ticked_eval',
  'bits_sequence_to_ticked_advance',
  'xor_bits',
  'and_bits',
  'or_bits',
  'not_bits',
  'gate_bits',
  'equals_bits',
  'at_least_bits',
  'majority_bits',
  'greater_than_bits',
  'mod_exp_bits',
  'mod_inverse_bits',
  'mux_bits',
  'demux_bits',
  'multi_router_bits',
  'multi_selector_bits',
  's_box',
  'add_mod_bits',
  'sub_mod_bits',
  'modulo_bits',
  'mul_mod_bits',
  'permute_bits',
  'byte_rotate_bits',
  'byte_swap_bits',
  'bit_join',
  'bit_split',
  'bit_pad',
  'bit_unpad',
  'bit_window',
  'bit_select',
  'bit_expand',
  'repeat_bits_to_length',
  'repeat_bits_to_match',
  'pad_bits_to_match',
  'broadcast_bits',
  'truncate_bits_to_match',
  'truncate_bits_sequence',
  'pad_bits_sequence',
  'bit_shift',
  'bit_shifter_bits',
  'clock_tick',
  'counter_init',
  'counter_eval',
  'counter_advance',
  'lfsr_init',
  'lfsr_eval',
  'lfsr_advance',
  'rotor_init',
  'rotor_eval',
  'rotor_advance',
  'reflector_eval',
  'plugboard_eval',
  'rotor_reverse_eval',
  'format_symbol_sink',
  'format_bit_sink',
  'format_hex_sink',
  'format_ticked_sink_line',
] as const;

const PYTHON_RUNTIME = `import math
import re

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
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


def _require_positive_int(value, label, module_name):
    if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
        raise ValueError(f"{module_name} expects {label} to be a positive integer")
    return value


def text_input(value):
    return {"out": str(value)}


def text_input_tick(value, tick):
    text = str(value)
    return {"out": text[tick] if tick < len(text) else ""}


def ascii_sequence_input(value):
    text = str(value)
    for char in text:
        if ord(char) > 0x7F:
            raise ValueError("AsciiSequenceInput accepts only 7-bit ASCII characters")
    return {"out": text}


def symbol_sequence_input(value):
    return {"out": str(value)}


def bit_sequence_input(stream):
    return {"out": _expect_bits(stream, "BitSequenceInput")}


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


def _validate_baudot_text(value):
    if not isinstance(value, str):
        raise ValueError("BaudotSource requires a text string")
    for char in value.upper():
        if not ("A" <= char <= "Z" or char == " "):
            raise ValueError("BaudotSource accepts only letters A-Z and spaces in letters mode")


def _encode_baudot_text(value):
    table = {
        "E": 1,
        "A": 3,
        " ": 4,
        "S": 5,
        "I": 6,
        "U": 7,
        "D": 9,
        "R": 10,
        "J": 11,
        "N": 12,
        "F": 13,
        "C": 14,
        "K": 15,
        "T": 16,
        "Z": 17,
        "L": 18,
        "W": 19,
        "H": 20,
        "Y": 21,
        "P": 22,
        "Q": 23,
        "O": 24,
        "B": 25,
        "G": 26,
        "M": 28,
        "X": 29,
        "V": 30,
    }
    bits = []
    for char in value.upper():
        code = table.get(char)
        if code is None:
            raise ValueError(f'BaudotSource cannot encode "{char}" in letters mode')
        for shift in (4, 3, 2, 1, 0):
            bits.append((code >> shift) & 1)
    return bits


def baudot_source(value):
    _validate_baudot_text(value)
    return {"out": _encode_baudot_text(value)}


def baudot_source_tick(value, tick):
    text = value if isinstance(value, str) else ""
    sliced = text[tick] if tick < len(text) else ""
    _validate_baudot_text(sliced)
    return {"out": _encode_baudot_text(sliced)}


def bit_source(stream):
    return {"out": _expect_bits(stream, "BitSource")}


def constant_bit(value):
    return {"out": [0 if int(value) == 0 else 1]}


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


def hex_sequence_input(value):
    return hex_source(value)


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


def _expect_symbol(signal, module_name):
    if not isinstance(signal, str):
        raise ValueError(f"{module_name} expects a symbol signal")
    return signal


def _parse_pollux_alphabet(value, field_name):
    if not isinstance(value, str):
        raise ValueError(f'Pollux Fractionation requires "{field_name}" to be a string')
    trimmed = value.strip()
    if not trimmed:
        raise ValueError(f'Pollux Fractionation requires "{field_name}" to contain at least one symbol')
    if "," in trimmed or any(char.isspace() for char in trimmed):
        raw_tokens = [part for part in re.split(r"[\\s,]+", trimmed) if part]
    else:
        raw_tokens = list(trimmed)
    tokens = [token.upper() for token in raw_tokens]
    if any(len(token) != 1 for token in tokens):
        raise ValueError(
            f'Pollux Fractionation requires "{field_name}" to contain only single-character symbols'
        )
    if any((token.isspace() or token == ",") for token in tokens):
        raise ValueError(
            f'Pollux Fractionation requires "{field_name}" to contain visible non-separator symbols'
        )
    if len(set(tokens)) != len(tokens):
        raise ValueError(f'Pollux Fractionation requires "{field_name}" to avoid duplicate symbols')
    return tokens


def pollux_fractionation(signal, zero_alphabet_value, one_alphabet_value):
    bits = _expect_bits(signal, "PolluxFractionation")
    zero_alphabet = _parse_pollux_alphabet(zero_alphabet_value, "zeroAlphabet")
    one_alphabet = _parse_pollux_alphabet(one_alphabet_value, "oneAlphabet")
    overlap = next((symbol for symbol in zero_alphabet if symbol in one_alphabet), None)
    if overlap is not None:
        raise ValueError(
            f'Pollux Fractionation requires zeroAlphabet and oneAlphabet to be disjoint (overlap: "{overlap}")'
        )
    output = []
    zero_index = 0
    one_index = 0
    for bit in bits:
        if bit == 0:
            output.append(zero_alphabet[zero_index % len(zero_alphabet)])
            zero_index += 1
        elif bit == 1:
            output.append(one_alphabet[one_index % len(one_alphabet)])
            one_index += 1
        else:
            raise ValueError("Pollux Fractionation expects only 0/1 bits")
    return {"out": "".join(output)}


def _pollux_selector_chunk_width(alphabet_length):
    if alphabet_length <= 1:
        return 0
    return math.ceil(math.log2(alphabet_length))


def _consume_pollux_selector_index(selector_bits, cursor, alphabet_length):
    width = _pollux_selector_chunk_width(alphabet_length)
    if width == 0:
        return 0, cursor
    if len(selector_bits) == 0:
        raise ValueError("Pollux Controlled Fractionation requires a non-empty selector bit stream")
    value = 0
    for offset in range(width):
        bit = selector_bits[(cursor + offset) % len(selector_bits)]
        if bit not in (0, 1):
            raise ValueError("Pollux Controlled Fractionation expects selector to contain only 0/1 bits")
        value = (value << 1) | bit
    return value % alphabet_length, cursor + width


def pollux_controlled_fractionation(signal, selector_signal, zero_alphabet_value, one_alphabet_value):
    bits = _expect_bits(signal, "PolluxControlledFractionation")
    selector_bits = _expect_bits(selector_signal, "PolluxControlledFractionation")
    zero_alphabet = _parse_pollux_alphabet(zero_alphabet_value, "zeroAlphabet")
    one_alphabet = _parse_pollux_alphabet(one_alphabet_value, "oneAlphabet")
    overlap = next((symbol for symbol in zero_alphabet if symbol in one_alphabet), None)
    if overlap is not None:
        raise ValueError(
            f'Pollux Fractionation requires zeroAlphabet and oneAlphabet to be disjoint (overlap: "{overlap}")'
        )
    output = []
    selector_cursor = 0
    for bit in bits:
        if bit not in (0, 1):
            raise ValueError("Pollux Controlled Fractionation expects only 0/1 bits")
        alphabet = zero_alphabet if bit == 0 else one_alphabet
        index, selector_cursor = _consume_pollux_selector_index(
            selector_bits, selector_cursor, len(alphabet)
        )
        output.append(alphabet[index])
    return {"out": "".join(output)}


def pollux_inverse(signal, zero_alphabet_value, one_alphabet_value):
    symbols = _expect_symbol(signal, "PolluxInverse")
    zero_alphabet = _parse_pollux_alphabet(zero_alphabet_value, "zeroAlphabet")
    one_alphabet = _parse_pollux_alphabet(one_alphabet_value, "oneAlphabet")
    overlap = next((symbol for symbol in zero_alphabet if symbol in one_alphabet), None)
    if overlap is not None:
        raise ValueError(
            f'Pollux Fractionation requires zeroAlphabet and oneAlphabet to be disjoint (overlap: "{overlap}")'
        )
    zero_set = set(zero_alphabet)
    one_set = set(one_alphabet)
    bits = []
    for symbol in symbols:
        normalized = symbol.upper()
        if normalized in zero_set:
            bits.append(0)
        elif normalized in one_set:
            bits.append(1)
        else:
            raise ValueError(
                f'Pollux Inverse encountered symbol "{symbol}" that is not present in either alphabet'
            )
    return {"out": bits}


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


def ascii_sequence_to_bits(signal):
    symbol = _expect_symbol(signal, "AsciiSequenceToBits")
    bits = []
    for char in symbol:
        value = ord(char)
        if value > 0x7F:
            raise ValueError("AsciiSequenceToBits accepts only 7-bit ASCII characters")
        bits.extend((value >> shift) & 1 for shift in range(7, -1, -1))
    return {"out": bits}


def ascii_char_to_bits(signal):
    symbol = _expect_symbol(signal, "AsciiCharToBits")
    if len(symbol) != 1:
        raise ValueError("AsciiCharToBits expects exactly one ASCII character")
    value = ord(symbol)
    if value > 0x7F:
        raise ValueError("AsciiCharToBits accepts only 7-bit ASCII characters")
    return {"out": [(value >> shift) & 1 for shift in range(7, -1, -1)]}


def bits_to_ascii_char(signal):
    bits = _expect_bits(signal, "BitsToAsciiChar")
    if len(bits) != 8:
        raise ValueError("BitsToAsciiChar expects exactly 8 bits; use padding or truncation helpers first")
    value = _bits_to_unsigned_number(bits)
    if value > 0x7F:
        raise ValueError("BitsToAsciiChar can only decode 7-bit ASCII byte values (0-127)")
    return {"out": chr(value)}


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


def hex_sequence_to_bits(signal):
    symbol = _expect_symbol(signal, "HexSequenceToBits")
    value = str(symbol).strip().replace(" ", "").upper()
    if any(char not in "0123456789ABCDEF" for char in value):
        raise ValueError("HexSource accepts only hexadecimal characters 0-9 and A-F")
    bits = []
    for digit in value:
        nibble = int(digit, 16)
        bits.extend((nibble >> shift) & 1 for shift in range(3, -1, -1))
    return {"out": bits}


def hex_digit_to_bits(signal):
    symbol = _expect_symbol(signal, "HexDigitToBits")
    if len(symbol) != 1:
        raise ValueError("HexDigitToBits expects exactly one hex digit")
    digit = symbol.upper()
    if digit not in "0123456789ABCDEF":
        raise ValueError("HexDigitToBits accepts only hexadecimal characters 0-9 and A-F")
    value = int(digit, 16)
    return {"out": [(value >> shift) & 1 for shift in range(3, -1, -1)]}


def bits_to_hex_digit(signal):
    bits = _expect_bits(signal, "BitsToHexDigit")
    if len(bits) != 4:
        raise ValueError("BitsToHexDigit expects exactly 4 bits")
    return {"out": format(_bits_to_unsigned_number(bits), "X")}


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


def repeat_symbol_to_length(signal, target_length):
    symbol = str(signal)
    characters = list(symbol)
    target_length = int(target_length)
    if target_length < 1:
        raise ValueError("RepeatSymbolToLength target length must be a positive integer.")
    if len(characters) == 0:
        raise ValueError("RepeatSymbolToLength cannot repeat an empty symbol sequence")
    return {"out": "".join(characters[index % len(characters)] for index in range(target_length))}


def pad_symbol_to_match(signal, reference, side, pad_char):
    symbol = str(signal)
    reference_symbol = str(reference)
    target_length = len(list(reference_symbol))
    if side not in ("left", "right"):
        raise ValueError("PadSymbolToMatch side must be left or right.")
    if not isinstance(pad_char, str) or len(pad_char) != 1:
        raise ValueError('PadSymbolToMatch requires "padChar" to be exactly one character')
    code_point = ord(pad_char)
    if code_point < 0x20 or code_point > 0x7E:
        raise ValueError('PadSymbolToMatch requires "padChar" to be one printable non-control ASCII character')
    if len(symbol) >= target_length:
        return {"out": symbol}
    pad_count = target_length - len(symbol)
    padding = pad_char * pad_count
    return {"out": padding + symbol if side == "left" else symbol + padding}


def require_symbol_length_match(signal, reference):
    symbol = str(signal)
    reference_symbol = str(reference)
    input_length = len(list(symbol))
    reference_length = len(list(reference_symbol))
    if input_length != reference_length:
        difference = input_length - reference_length
        direction = "shorter" if difference < 0 else "longer"
        unit = "char" if abs(difference) == 1 else "chars"
        raise ValueError(
            f"RequireSymbolLengthMatch mismatch: input {input_length} chars; reference {reference_length} chars — input is {abs(difference)} {unit} {direction}"
        )
    return {"out": symbol}


def repeat_symbol_to_match(signal, reference):
    symbol = str(signal)
    characters = list(symbol)
    reference_symbol = str(reference)
    target_length = len(list(reference_symbol))
    if target_length == 0:
        return {"out": ""}
    if len(characters) == 0:
        raise ValueError("RepeatSymbolToMatch requires a non-empty input sequence to repeat")
    return {"out": "".join(characters[index % len(characters)] for index in range(target_length))}


def truncate_symbol_to_match(signal, reference, side):
    symbol = str(signal)
    characters = list(symbol)
    reference_symbol = str(reference)
    target_length = len(list(reference_symbol))
    if side not in ("left", "right"):
        raise ValueError("TruncateSymbolToMatch side must be left or right.")
    if len(characters) <= target_length:
        return {"out": symbol}
    if side == "left":
        return {"out": "".join(characters[:target_length])}
    return {"out": "".join(characters[-target_length:])}


def truncate_symbol_sequence(signal, target_length, side):
    symbol = str(signal)
    characters = list(symbol)
    target_length = int(target_length)
    if target_length < 0:
        raise ValueError("TruncateSymbolSequence requires a non-negative target length.")
    if side not in ("left", "right"):
        raise ValueError("TruncateSymbolSequence side must be left or right.")
    if len(characters) <= target_length:
        return {"out": symbol}
    if side == "left":
        return {"out": "".join(characters[:target_length])}
    return {"out": "".join(characters[len(characters) - target_length:])}


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


def multi_selector(select, inputs, select_count):
    select_bits = _expect_bits(select, "MultiSelector")
    select_count = int(select_count)
    if select_count not in (2, 4, 8):
        raise ValueError('MultiSelector requires "selectCount" to be 2, 4, or 8')
    required_select_width = {2: 1, 4: 2, 8: 3}[select_count]
    if len(select_bits) != required_select_width:
        raise ValueError(
            f"MultiSelector expects select to be a {required_select_width}-bit word when selectCount is {select_count}"
        )
    if len(inputs) != 8:
        raise ValueError("MultiSelector expects exactly 8 candidate inputs in the export runtime")
    selected_index = _bits_to_unsigned_number(select_bits)
    selected_input = inputs[selected_index if selected_index < select_count else 0]
    return {"out": _expect_bits(selected_input, "MultiSelector")}


def _parse_s_box_dimensions(input_bits, output_bits, table_value):
    if input_bits in (None, "") and output_bits in (None, ""):
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
        return width, width, entry_count, (1 << width) - 1, True

    try:
        normalized_input_bits = int(input_bits)
        normalized_output_bits = int(output_bits)
    except (TypeError, ValueError) as error:
        raise ValueError("SBox inputBits and outputBits must both be set together") from error

    supported_shapes = {
        (4, 4): (16, 15, True),
        (6, 4): (64, 15, False),
        (8, 8): (256, 255, True),
    }
    shape = supported_shapes.get((normalized_input_bits, normalized_output_bits))
    if shape is None:
        raise ValueError("SBox only supports 4->4, 6->4, and 8->8 tables")

    entry_count, max_entry, requires_permutation = shape
    return normalized_input_bits, normalized_output_bits, entry_count, max_entry, requires_permutation


def _parse_s_box_table(table_value, input_bits=None, output_bits=None):
    parts = [part.strip() for part in str(table_value).split(",") if part.strip()]
    if not parts:
        raise ValueError("SBox table cannot be empty")
    normalized_input_bits, normalized_output_bits, entry_count, max_entry, requires_permutation = _parse_s_box_dimensions(
        input_bits,
        output_bits,
        table_value,
    )
    if len(parts) != entry_count:
        raise ValueError(f"SBox table must contain exactly {entry_count} entries for {normalized_input_bits}->{normalized_output_bits}")
    entries = []
    for part in parts:
        entry = int(part)
        if entry < 0 or entry > max_entry:
            raise ValueError(f"SBox entries must be integers between 0 and {max_entry}")
        entries.append(entry)
    if requires_permutation and len(set(entries)) != len(entries):
        raise ValueError("SBox table must be a permutation with no duplicates")
    return entries, normalized_input_bits, normalized_output_bits


def s_box(signal, table, input_bits=None, output_bits=None):
    bits = _expect_bits(signal, "SBox")
    if not bits:
        return {"out": []}
    entries, normalized_input_bits, normalized_output_bits = _parse_s_box_table(table, input_bits, output_bits)
    if len(bits) % normalized_input_bits != 0:
        raise ValueError(f"SBox input width must be a multiple of {normalized_input_bits} bits")
    output = []
    for index in range(0, len(bits), normalized_input_bits):
        chunk = bits[index:index + normalized_input_bits]
        output.extend(_unsigned_number_to_bits(entries[_bits_to_unsigned_number(chunk)], normalized_output_bits))
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


def mod_exp(base, exp, modulus):
    base_bits = _expect_bits(base, "ModExp")
    exp_bits = _expect_bits(exp, "ModExp")
    modulus = int(modulus)
    if modulus < 2:
        raise ValueError("ModExp requires a modulus of at least 2")
    width = len(base_bits)
    if width == 0:
        return {"out": []}
    max_value = 2 ** width
    if modulus > max_value:
        raise ValueError("ModExp modulus must not exceed the base word range")
    base_value = _bits_to_unsigned_number(base_bits)
    exp_value = _bits_to_unsigned_number(exp_bits)
    if modulus == 1:
        return {"out": _unsigned_number_to_bits(0, width)}
    result = 1
    factor = base_value % modulus
    exponent = exp_value
    while exponent > 0:
        if exponent % 2 == 1:
            result = (result * factor) % modulus
        exponent = exponent // 2
        factor = (factor * factor) % modulus
    return {"out": _unsigned_number_to_bits(result, width)}


def _extended_gcd(a, b):
    old_r = a
    r = b
    old_s = 1
    s = 0
    while r != 0:
        q = old_r // r
        temp_r = r
        r = old_r - q * r
        old_r = temp_r
        temp_s = s
        s = old_s - q * s
        old_s = temp_s
    return {"gcd": old_r, "x": old_s}


def mod_inverse(signal, modulus):
    bits = _expect_bits(signal, "ModInverse")
    modulus = int(modulus)
    if modulus < 2:
        raise ValueError("ModInverse requires a modulus of at least 2")
    width = len(bits)
    if width == 0:
        return {"out": []}
    max_value = 2 ** width
    if modulus > max_value:
        raise ValueError("ModInverse modulus must not exceed the input word range")
    value = _bits_to_unsigned_number(bits)
    egcd = _extended_gcd(value, modulus)
    if egcd["gcd"] != 1:
        raise ValueError(f'ModInverse: {value} has no inverse mod {modulus} (GCD is {egcd["gcd"]})')
    result = ((egcd["x"] % modulus) + modulus) % modulus
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


def bit_select(signal, order):
    bits = _expect_bits(signal, "BitSelect")
    parts = [part.strip() for part in str(order).split(",") if part.strip()]
    if not parts:
        raise ValueError("BitSelect order cannot be empty")
    selection = []
    seen = set()
    for part in parts:
        index = int(part)
        if index < 0:
            raise ValueError("BitSelect order must contain only non-negative integers")
        if index >= len(bits):
            raise ValueError(f"BitSelect index {index} is out of range for input width {len(bits)}")
        if index in seen:
            raise ValueError(f"BitSelect index {index} appears more than once in the selection order")
        seen.add(index)
        selection.append(index)
    return {"out": [bits[index] for index in selection]}


def bit_expand(signal, order):
    bits = _expect_bits(signal, "BitExpand")
    parts = [part.strip() for part in str(order).split(",") if part.strip()]
    if not parts:
        raise ValueError("BitExpand order cannot be empty")
    expansion = []
    for part in parts:
        index = int(part)
        if index < 0:
            raise ValueError("BitExpand order must contain only non-negative integers")
        if index >= len(bits):
            raise ValueError(f"BitExpand index {index} is out of range for input width {len(bits)}")
        expansion.append(index)
    return {"out": [bits[index] for index in expansion]}


def repeat_bits_to_length(signal, target_length):
    bits = _expect_bits(signal, "RepeatBitsToLength")
    target_length = int(target_length)
    if target_length < 1:
        raise ValueError("RepeatBitsToLength target length must be a positive integer.")
    if len(bits) == 0:
        raise ValueError("RepeatBitsToLength cannot repeat an empty bit sequence")
    return {"out": [bits[index % len(bits)] for index in range(target_length)]}


def pad_bits_to_match(signal, reference, side, pad_bit):
    bits = _expect_bits(signal, "PadBitsToMatch")
    reference_bits = _expect_bits(reference, "PadBitsToMatch")
    target_length = len(reference_bits)
    if side not in ("left", "right"):
        raise ValueError("PadBitsToMatch side must be left or right.")
    if str(pad_bit) not in ("0", "1"):
        raise ValueError('PadBitsToMatch requires "padBit" to be 0 or 1')
    if len(bits) >= target_length:
        return {"out": bits.copy()}
    pad_count = target_length - len(bits)
    pad_value = 1 if str(pad_bit) == "1" else 0
    padding = [pad_value for _ in range(pad_count)]
    return {"out": padding + bits if side == "left" else bits + padding}


def require_bits_length_match(signal, reference):
    bits = _expect_bits(signal, "RequireBitsLengthMatch")
    reference_bits = _expect_bits(reference, "RequireBitsLengthMatch")
    if len(bits) != len(reference_bits):
        difference = len(bits) - len(reference_bits)
        direction = "shorter" if difference < 0 else "longer"
        unit = "bit" if abs(difference) == 1 else "bits"
        raise ValueError(
            f"RequireBitsLengthMatch mismatch: input {len(bits)} bits; reference {len(reference_bits)} bits — input is {abs(difference)} {unit} {direction}"
        )
    return {"out": bits.copy()}


def repeat_bits_to_match(signal, reference):
    bits = _expect_bits(signal, "RepeatBitsToMatch")
    reference_bits = _expect_bits(reference, "RepeatBitsToMatch")
    target_length = len(reference_bits)
    if target_length == 0:
        return {"out": []}
    if len(bits) == 0:
        raise ValueError("RepeatBitsToMatch requires a non-empty input sequence to repeat")
    return {"out": [bits[index % len(bits)] for index in range(target_length)]}


def truncate_bits_to_match(signal, reference, side):
    bits = _expect_bits(signal, "TruncateBitsToMatch")
    reference_bits = _expect_bits(reference, "TruncateBitsToMatch")
    target_length = len(reference_bits)
    if side not in ("left", "right"):
        raise ValueError("TruncateBitsToMatch side must be left or right.")
    if len(bits) <= target_length:
        return {"out": bits.copy()}
    if side == "left":
        return {"out": bits[:target_length]}
    return {"out": bits[-target_length:]}


def broadcast_bits(signal, copies):
    bits = _expect_bits(signal, "BroadcastBits")
    copies = int(copies)
    if copies < 1:
        raise ValueError("BroadcastBits copies must be a positive integer.")
    if len(bits) == 0:
        raise ValueError("BroadcastBits cannot broadcast an empty bit pattern")
    return {"out": bits * copies}


def truncate_bits_sequence(signal, target_length, side):
    bits = _expect_bits(signal, "TruncateBitsSequence")
    target_length = int(target_length)
    if target_length < 0:
        raise ValueError("TruncateBitsSequence requires a non-negative target length.")
    if side not in ("left", "right"):
        raise ValueError("TruncateBitsSequence side must be left or right.")
    if len(bits) <= target_length:
        return {"out": bits[:]}
    if side == "left":
        return {"out": bits[:target_length]}
    return {"out": bits[len(bits) - target_length:]}


def pad_bits_sequence(signal, target_length, side, pad_bit):
    bits = _expect_bits(signal, "PadBitsSequence")
    target_length = int(target_length)
    if target_length < 0:
        raise ValueError("PadBitsSequence requires a non-negative target length.")
    if side not in ("left", "right"):
        raise ValueError("PadBitsSequence side must be left or right.")
    if str(pad_bit) not in ("0", "1"):
        raise ValueError("PadBitsSequence padBit must be 0 or 1.")
    if len(bits) >= target_length:
        return {"out": bits[:]}
    fill = 1 if str(pad_bit) == "1" else 0
    padding = [fill for _ in range(target_length - len(bits))]
    if side == "left":
        return {"out": padding + bits}
    return {"out": bits + padding}


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


def ascii_sequence_to_ticked_init(index, wrap):
    index = int(index)
    if index < 0:
        raise ValueError('AsciiSequenceToTicked requires "index" to be a non-negative integer')
    return {
        "index": index,
        "wrap": bool(wrap),
    }


def ascii_sequence_to_ticked_eval(sequence, state):
    text = str(sequence)
    for char in text:
        if ord(char) > 0x7F:
            raise ValueError("AsciiSequenceToTicked accepts only 7-bit ASCII characters")
    if len(text) == 0:
        return {"out": ""}
    index = int(state["index"])
    if state["wrap"]:
        index = index % len(text)
    if index < 0 or index >= len(text):
        return {"out": ""}
    return {"out": text[index]}


def ascii_sequence_to_ticked_advance(state):
    state["index"] = int(state["index"]) + 1


def ticked_symbols_to_sequence_init(collected, count):
    text = str(collected)
    count = int(count)
    if count < 0:
        raise ValueError('TickedSymbolsToSequence requires "count" to be a non-negative integer')
    return {
        "collected": text,
        "count": count,
    }


def ticked_symbols_to_sequence_eval(symbol, clock, state):
    text = str(symbol)
    should_collect = clock is None or _is_active_control_pulse(_expect_bits(clock, "TickedSymbolsToSequence"))
    if should_collect and len(text) > 0:
        return {"out": state["collected"] + text}
    return {"out": state["collected"]}


def ticked_symbols_to_sequence_advance(symbol, clock, state):
    text = str(symbol)
    should_collect = clock is None or _is_active_control_pulse(_expect_bits(clock, "TickedSymbolsToSequence"))
    if should_collect and len(text) > 0:
        state["collected"] = state["collected"] + text
        state["count"] = int(state["count"]) + len(text)


def symbol_sequence_to_ticked_init(index, wrap):
    index = int(index)
    if index < 0:
        raise ValueError('SymbolSequenceToTicked requires "index" to be a non-negative integer')
    return {
        "index": index,
        "wrap": bool(wrap),
    }


def symbol_sequence_to_ticked_eval(sequence, state):
    text = str(sequence)
    if len(text) == 0:
        return {"out": ""}
    index = int(state["index"])
    if state["wrap"]:
        index = index % len(text)
    if index < 0 or index >= len(text):
        return {"out": ""}
    return {"out": text[index]}


def symbol_sequence_to_ticked_advance(state):
    state["index"] = int(state["index"]) + 1


def ticked_bits_to_sequence_init(collected, count):
    bits = _expect_bits(collected, "TickedBitsToSequence")
    count = int(count)
    if count < 0:
        raise ValueError('TickedBitsToSequence requires "count" to be a non-negative integer')
    return {
        "collected": bits[:],
        "count": count,
    }


def ticked_bits_to_sequence_eval(word, clock, state):
    bits = _expect_bits(word, "TickedBitsToSequence")
    should_collect = clock is None or _is_active_control_pulse(_expect_bits(clock, "TickedBitsToSequence"))
    if should_collect and len(bits) > 0:
        return {"out": state["collected"] + bits}
    return {"out": state["collected"][:]}


def ticked_bits_to_sequence_advance(word, clock, state):
    bits = _expect_bits(word, "TickedBitsToSequence")
    should_collect = clock is None or _is_active_control_pulse(_expect_bits(clock, "TickedBitsToSequence"))
    if should_collect and len(bits) > 0:
        state["collected"] = state["collected"] + bits
        state["count"] = int(state["count"]) + len(bits)


def _normalize_remainder_mode(value):
    if value not in ("pad", "truncate", "error"):
        raise ValueError('BitsSequenceToTicked requires "remainderMode" to be pad, truncate, or error')
    return value


def bits_sequence_to_ticked_init(index, word_width, wrap, remainder_mode):
    index = int(index)
    if index < 0:
        raise ValueError('BitsSequenceToTicked requires "index" to be a non-negative integer')
    return {
        "index": index,
        "word_width": _require_positive_int(word_width, "wordWidth", "BitsSequenceToTicked"),
        "wrap": bool(wrap),
        "remainder_mode": _normalize_remainder_mode(remainder_mode),
    }


def _build_bits_sequence_words(bits, word_width, remainder_mode):
    if len(bits) == 0:
        return []
    words = []
    full_word_count = len(bits) // word_width
    for index in range(full_word_count):
        start = index * word_width
        words.append(bits[start:start + word_width])
    remainder = len(bits) % word_width
    if remainder == 0:
        return words
    tail = bits[len(bits) - remainder:]
    if remainder_mode == "truncate":
        return words
    if remainder_mode == "pad":
        words.append(tail + [0] * (word_width - remainder))
        return words
    raise ValueError(
        f"BitsSequenceToTicked cannot emit {len(bits)} bits as {word_width}-bit words without an explicit remainder policy"
    )


def bits_sequence_to_ticked_eval(sequence, state):
    bits = _expect_bits(sequence, "BitsSequenceToTicked")
    words = _build_bits_sequence_words(bits, state["word_width"], state["remainder_mode"])
    if len(words) == 0:
        return {"out": []}
    index = int(state["index"])
    if state["wrap"]:
        index = index % len(words)
    if index < 0 or index >= len(words):
        return {"out": []}
    return {"out": list(words[index])}


def bits_sequence_to_ticked_advance(state):
    state["index"] = int(state["index"]) + 1


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

const PYTHON_RUNTIME_EXPORT_NAMES = [...PYTHON_RUNTIME_PUBLIC_EXPORT_NAMES].sort(
  (left, right) => right.length - left.length,
);

export interface PythonExportFiles {
  runtimeFileName: string;
  runtimeSource: string;
  workspaceFileName: string;
  workspaceSource: string;
  parityFileName: string;
  paritySource: string;
}

export interface PythonExportParityCase {
  id: string;
  mode: 'stateless' | 'ticked';
  sourceModuleId: string;
  sourceDefId: string;
  sourceLabel: string;
  inputValue: string;
  expectedOutput: string;
  tickCount?: number;
}

export interface PythonExportParityCandidate extends PythonExportParityCase {
  targetSinkModuleId?: string;
  targetSinkLabel?: string;
}

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
  hasParamOverride: (moduleId: string, key: string) => boolean;
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

interface CompositeCollectionContext {
  orderedDefs: CompositeDef[];
  definitionsById: Map<string, CompositeExportDefinition>;
}

interface IteratorExportDefinition {
  lookupKey: string;
  moduleInstance: ModuleInstance;
  def: IteratorDef;
  roundDef: ModuleDefinition;
  functionName: string;
  resolvedIterationCount: number;
  stateful: boolean;
  inputArgNames: Map<string, string>;
  ownerCompositeDefId?: string;
  iterationCountArgName?: string;
  sourceLabel: string;
  definitionHelper: boolean;
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

export function getPythonRuntimeFileName() {
  return 'mcw_runtime.py';
}

function getPythonParityFileName() {
  return 'verify_parity.py';
}

function getPythonRuntimeSurfaceWorkspaceFileName(workspaceName: string) {
  const fileName = getPythonExportFileName(workspaceName);
  return fileName === getPythonRuntimeFileName() || fileName === 'mcw-runtime.py'
    ? 'mcw-workspace.py'
    : fileName;
}

function buildPythonRuntimeLibrarySource() {
  const exportsLiteral = PYTHON_RUNTIME_PUBLIC_EXPORT_NAMES
    .map((symbolName) => JSON.stringify(symbolName))
    .join(', ');
  return `# Generated by MCW Python export runtime\n# Public runtime surface for generated MCW workspaces\n__version__ = ${JSON.stringify(PYTHON_RUNTIME_VERSION)}\n__all__ = [${exportsLiteral}]\n\n${PYTHON_RUNTIME}\n`;
}

function qualifyPythonRuntimeReferences(workspaceSource: string) {
  let qualifiedSource = workspaceSource;
  for (const symbolName of PYTHON_RUNTIME_EXPORT_NAMES) {
    qualifiedSource = qualifiedSource.replace(
      new RegExp(`(?<!\\.)\\b${symbolName}\\b`, 'g'),
      `mcw_runtime.${symbolName}`,
    );
  }
  return qualifiedSource;
}

function buildPythonWorkspaceFileHeader(
  workspaceName: string,
  stateful: boolean,
) {
  return [
    '# Generated by MCW Python export workspace',
    `# Workspace: ${workspaceName}`,
    `# Requires ${getPythonRuntimeFileName()} version ${PYTHON_RUNTIME_VERSION}`,
    `# Execution mode: ${stateful ? 'ticked' : 'stateless'}`,
    'import mcw_runtime',
    '',
  ].join('\n');
}

function getPythonVerificationSourceParamKey(defId: string) {
  switch (defId) {
    case 'TextInput':
    case 'AsciiSequenceInput':
    case 'AsciiSource':
    case 'BaudotSource':
    case 'HexSource':
    case 'HexSequenceInput':
      return 'value';
    default:
      return null;
  }
}

function buildPythonSourceParamOverrides(
  project: Project,
  registry: ModuleRegistry,
  sourceOverridesExpression: string,
) {
  const overrides = new Map<string, string>();

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def) {
      continue;
    }

    const paramKey = getPythonVerificationSourceParamKey(def.id);
    if (!paramKey) {
      continue;
    }

    overrides.set(
      `${moduleInstance.id}:${paramKey}`,
      `_mcw_source_override(${sourceOverridesExpression}, ${JSON.stringify(moduleInstance.id)}, ${getDefaultParamExpression(moduleInstance, def, paramKey)})`,
    );
  }

  return overrides;
}

function buildPythonParityScript(
  workspaceName: string,
  workspaceFileName: string,
  parityCases: PythonExportParityCase[],
  parityStatusReason: string | null,
  parityStatusDetails: string[],
) {
  const embeddedCases = parityCases.map((parityCase) => ({
    id: parityCase.id,
    mode: parityCase.mode,
    sourceModuleId: parityCase.sourceModuleId,
    sourceLabel: parityCase.sourceLabel,
    inputValue: parityCase.inputValue,
    expectedOutput: parityCase.expectedOutput,
    tickCount: parityCase.tickCount ?? null,
  }));
  const parityStatus = {
    embedded: embeddedCases.length > 0,
    reason: parityStatusReason,
    details: parityStatusDetails,
  };

  return [
    '# Generated by MCW engine/export parity check',
    `# Workspace: ${workspaceName}`,
    `# Requires ${getPythonRuntimeFileName()} version ${PYTHON_RUNTIME_VERSION}`,
    '# Expected Python: 3.8+',
    'import importlib.util',
    'import pathlib',
    '',
    `PARITY_CASES = ${toPythonLiteral(embeddedCases)}`,
    `PARITY_STATUS = ${toPythonLiteral(parityStatus)}`,
    `WORKSPACE_FILE_NAME = ${JSON.stringify(workspaceFileName)}`,
    '',
    'def _load_workspace_module():',
    '    workspace_path = pathlib.Path(__file__).with_name(WORKSPACE_FILE_NAME)',
    '    spec = importlib.util.spec_from_file_location("mcw_exported_workspace", workspace_path)',
    '    if spec is None or spec.loader is None:',
    '        raise RuntimeError(f"Unable to load exported workspace from {workspace_path}")',
    '    module = importlib.util.module_from_spec(spec)',
    '    spec.loader.exec_module(module)',
    '    return module',
    '',
    'def _normalize_output(value):',
    '    return str(value).strip()',
    '',
    'def _run_case(workspace_module, case):',
    '    source_overrides = {case["sourceModuleId"]: case["inputValue"]}',
    '    if case["mode"] == "ticked":',
    '        if not hasattr(workspace_module, "_mcw_ticked_verification_output"):',
    '            raise RuntimeError("Exported workspace does not expose ticked parity support.")',
    '        return _normalize_output(workspace_module._mcw_ticked_verification_output(case["tickCount"], source_overrides))',
    '    if not hasattr(workspace_module, "_mcw_verification_output"):',
    '        raise RuntimeError("Exported workspace does not expose stateless parity support.")',
    '    return _normalize_output(workspace_module._mcw_verification_output(source_overrides))',
    '',
    'def main():',
    '    print("MCW Engine Parity Check")',
    `    print("Runtime version: ${PYTHON_RUNTIME_VERSION}")`,
    '    print("Python baseline: 3.8+")',
    '    if not PARITY_CASES:',
    '        print("No embedded parity cases were generated for this export.")',
    '        if PARITY_STATUS.get("reason"):',
    '            print(f"Reason: {PARITY_STATUS[\'reason\']}")',
    '        for detail in PARITY_STATUS.get("details", []):',
    '            print(f"  - {detail}")',
    '        return 0',
    '    workspace_module = _load_workspace_module()',
    '    failures = 0',
    '    for case in PARITY_CASES:',
    '        expected = _normalize_output(case["expectedOutput"])',
    '        detail = f"{case[\'sourceLabel\']} <- {case[\'inputValue\']}"',
    '        if case["mode"] == "ticked" and case["tickCount"] is not None:',
    '            detail = f"{detail} @ {case[\'tickCount\']} ticks"',
    '        try:',
    '            actual = _run_case(workspace_module, case)',
    '        except Exception as error:',
    '            failures += 1',
    '            print(f"FAIL [{case[\'mode\']}] {detail}")',
    '            print(f"  error: {error}")',
    '            continue',
    '        if actual == expected:',
    '            print(f"PASS [{case[\'mode\']}] {detail}")',
    '            continue',
    '        failures += 1',
    '        print(f"FAIL [{case[\'mode\']}] {detail}")',
    '        print(f"  expected: {expected}")',
    '        print(f"  actual:   {actual}")',
    '    passed = len(PARITY_CASES) - failures',
    '    print(f"Summary: {passed} passed, {failures} failed")',
    '    return 1 if failures else 0',
    '',
    'if __name__ == "__main__":',
    '    raise SystemExit(main())',
    '',
  ].join('\n');
}

function formatPythonParitySinkValue(defId: string, signal: Signal) {
  if (SYMBOL_SINK_DEF_IDS.has(defId)) {
    return String(signal.value);
  }

  if (BIT_SINK_DEF_IDS.has(defId)) {
    if (signal.type !== 'bits') {
      throw new Error('Bit sink expected a bits signal.');
    }
    return signal.value.join('');
  }

  if (HEX_SINK_DEF_IDS.has(defId)) {
    return String(signal.value).toUpperCase();
  }

  throw new Error(`Unsupported parity sink ${defId}.`);
}

function getPythonParityInputValue(defId: string, rawValue: unknown) {
  const stringValue = typeof rawValue === 'string' ? rawValue : String(rawValue ?? '');
  const trimmed = stringValue.trim();
  if (defId === 'HexSource') {
    return trimmed.replace(/^0x/i, '').replace(/\s+/g, '').toUpperCase();
  }
  return trimmed;
}

function collectTickedParityOutput(
  result: TickedExecutionResult,
  targetSinkModuleId?: string,
) {
  let transcript = '';
  let previousTickValue = '';

  for (const tick of result.ticks) {
    const sink = resolvePythonParitySinkCandidate(tick, targetSinkModuleId);
    const currentTickValue = sink?.formattedOutput ?? '';

    if (currentTickValue.length === 0) {
      previousTickValue = currentTickValue;
      continue;
    }

    if (
      previousTickValue.length > 0 &&
      currentTickValue.length > previousTickValue.length &&
      currentTickValue.startsWith(previousTickValue)
    ) {
      transcript += currentTickValue.slice(previousTickValue.length);
    } else {
      transcript += currentTickValue;
    }

    previousTickValue = currentTickValue;
  }

  return transcript;
}

function resolvePythonParitySinkCandidate(
  execution: ExecutionResult | null,
  targetSinkModuleId?: string,
) {
  if (!execution) {
    return null;
  }

  const candidates = execution.trace
    .filter((entry) => {
      const outputSignal = entry.outputs.out ?? entry.inputs.in ?? null;
      return (
        (SYMBOL_SINK_DEF_IDS.has(entry.defId) ||
          BIT_SINK_DEF_IDS.has(entry.defId) ||
          HEX_SINK_DEF_IDS.has(entry.defId)) &&
        outputSignal !== null
      );
    })
    .map((entry) => {
      const outputSignal = entry.outputs.out ?? entry.inputs.in ?? null;
      if (!outputSignal) {
        return null;
      }
      return {
        moduleId: entry.moduleId,
        defId: entry.defId,
        label: `${entry.moduleId} (${entry.defId})`,
        formattedOutput: formatPythonParitySinkValue(entry.defId, outputSignal),
      };
    })
    .filter((candidate): candidate is {
      moduleId: string;
      defId: string;
      label: string;
      formattedOutput: string;
    } => candidate !== null);

  if (targetSinkModuleId) {
    return candidates.find((candidate) => candidate.moduleId === targetSinkModuleId) ?? null;
  }

  return candidates[0] ?? null;
}

function resolvePythonParityTerminalSinkCandidate(
  project: Project,
  registry: ModuleRegistry,
  execution: ExecutionResult | null,
) {
  if (!execution) {
    return null;
  }

  const traceByModuleId = new Map(execution.trace.map((entry) => [entry.moduleId, entry]));
  const order = buildTopologicalOrder(project, registry);

  for (let index = order.length - 1; index >= 0; index -= 1) {
    const moduleId = order[index];
    if (!moduleId) {
      continue;
    }
    const entry = traceByModuleId.get(moduleId);
    if (!entry) {
      continue;
    }
    const outputSignal = entry.outputs.out ?? entry.inputs.in ?? null;
    if (
      (SYMBOL_SINK_DEF_IDS.has(entry.defId) ||
        BIT_SINK_DEF_IDS.has(entry.defId) ||
        HEX_SINK_DEF_IDS.has(entry.defId)) &&
      outputSignal !== null
    ) {
      return {
        moduleId: entry.moduleId,
        defId: entry.defId,
        formattedOutput: formatPythonParitySinkValue(entry.defId, outputSignal),
      };
    }
  }

  return null;
}

function getPythonParitySourcePriority(moduleId: string, defId: string) {
  const normalizedId = moduleId.toLowerCase();
  const isConfigurationLike =
    defId === 'IV' ||
    defId === 'Nonce' ||
    defId === 'Salt' ||
    normalizedId.includes('const') ||
    normalizedId.includes('round-const') ||
    normalizedId.includes('protocol');
  if (isConfigurationLike) {
    return null;
  }

  let priority = 100;
  switch (defId) {
    case 'TextInput':
    case 'AsciiSequenceInput':
    case 'AsciiSource':
    case 'BaudotSource':
    case 'HexSource':
      priority = 0;
      break;
    case 'HexSequenceInput':
      priority = 10;
      break;
    default:
      priority = 50;
      break;
  }

  if (normalizedId.includes('key')) {
    priority += 20;
  }
  if (normalizedId.includes('iv') || normalizedId.includes('nonce') || normalizedId.includes('salt')) {
    priority += 100;
  }

  return priority;
}

function listPythonParitySourceCandidates(
  project: Project,
  registry: ModuleRegistry,
  terminalSinkModuleId?: string,
) {
  const relevantAncestors = new Set<string>();
  if (terminalSinkModuleId) {
    const reverseAdjacency = new Map<string, string[]>();
    for (const moduleInstance of project.modules) {
      reverseAdjacency.set(moduleInstance.id, []);
    }
    for (const connection of project.connections) {
      reverseAdjacency.get(connection.to.moduleId)?.push(connection.from.moduleId);
    }
    const pending = [terminalSinkModuleId];
    while (pending.length > 0) {
      const current = pending.pop();
      if (!current) {
        continue;
      }
      for (const parent of reverseAdjacency.get(current) ?? []) {
        if (relevantAncestors.has(parent)) {
          continue;
        }
        relevantAncestors.add(parent);
        pending.push(parent);
      }
    }
  }

  const candidates = project.modules
    .filter((moduleInstance) => {
      if (terminalSinkModuleId && !relevantAncestors.has(moduleInstance.id)) {
        return false;
      }
      const def = registry[moduleInstance.defId];
      return def ? getPythonVerificationSourceParamKey(def.id) !== null : false;
    })
    .map((moduleInstance) => {
      const def = registry[moduleInstance.defId];
      const priority = getPythonParitySourcePriority(moduleInstance.id, moduleInstance.defId);
      return {
        moduleId: moduleInstance.id,
        defId: moduleInstance.defId,
        label: `${moduleInstance.id} (${def?.name ?? moduleInstance.defId})`,
        priority,
      };
    });

  const nonConfigurationCandidates = candidates.filter((candidate) => candidate.priority !== null);
  if (nonConfigurationCandidates.length === 0) {
    return [] as Array<{ moduleId: string; defId: string; label: string; priority: number | null }>;
  }

  const bestPriority = Math.min(
    ...nonConfigurationCandidates
      .map((candidate) => candidate.priority)
      .filter((priority): priority is number => priority !== null),
  );

  return nonConfigurationCandidates.filter((candidate) => candidate.priority === bestPriority);
}

function deriveEmbeddedPythonParity(
  project: Project,
  registry: ModuleRegistry,
  parityCandidates: PythonExportParityCandidate[],
) {
  const hasStatefulModules = projectHasStatefulExportCandidate(project, registry);

  const matchingExplicitCases = parityCandidates.filter((candidate) => {
    if (candidate.mode !== (hasStatefulModules ? 'ticked' : 'stateless')) {
      return false;
    }
    return true;
  });

  let execution: ExecutionResult | null = null;
  let tickedExecution: TickedExecutionResult | null = null;
  try {
    if (hasStatefulModules) {
      const tickCount = derivePythonExportTickCount(project, registry);
      if (tickCount === null) {
        return {
          parityCases: [] as PythonExportParityCase[],
          statusReason: 'Export-time validation/execution failed.',
          statusDetails: ['Unable to derive a natural tick count for parity embedding.'],
        };
      }
      tickedExecution = executeTickedProject(project, registry, tickCount);
      execution = tickedExecution.ticks[0] ?? null;
    } else {
      execution = executeProject(project, registry);
    }
  } catch (error) {
    return {
      parityCases: [] as PythonExportParityCase[],
      statusReason: 'Export-time validation/execution failed.',
      statusDetails: [error instanceof Error ? error.message : 'MCW could not execute the workspace during export.'],
    };
  }

  const sinkCandidate = resolvePythonParityTerminalSinkCandidate(project, registry, execution);
  if (!sinkCandidate) {
    return {
      parityCases: [] as PythonExportParityCase[],
      statusReason: 'No supported parity sink was found.',
      statusDetails: [] as string[],
    };
  }

  const sourceCandidates = listPythonParitySourceCandidates(project, registry, sinkCandidate.moduleId);
  if (sourceCandidates.length === 0) {
    return {
      parityCases: [] as PythonExportParityCase[],
      statusReason: 'No supported primary parity source was found.',
      statusDetails: [] as string[],
    };
  }

  if (sourceCandidates.length > 1) {
    return {
      parityCases: [] as PythonExportParityCase[],
      statusReason: 'Multiple candidate parity sources were detected.',
      statusDetails: sourceCandidates.map((candidate) => candidate.label),
    };
  }

  const sourceCandidate = sourceCandidates[0];
  if (!sourceCandidate) {
    return {
      parityCases: [] as PythonExportParityCase[],
      statusReason: 'No supported primary parity source was found.',
      statusDetails: [] as string[],
    };
  }

  const explicitCase = matchingExplicitCases.find(
    (candidate) =>
      candidate.sourceModuleId === sourceCandidate.moduleId &&
      (
      candidate.targetSinkModuleId === undefined ||
      candidate.targetSinkModuleId === sinkCandidate.moduleId
      ),
  );
  if (explicitCase) {
    return {
      parityCases: [
        {
          id: explicitCase.id,
          mode: explicitCase.mode,
          sourceModuleId: explicitCase.sourceModuleId,
          sourceDefId: explicitCase.sourceDefId,
          sourceLabel: explicitCase.sourceLabel,
          inputValue: explicitCase.inputValue,
          expectedOutput: explicitCase.expectedOutput,
          ...(explicitCase.tickCount !== undefined ? { tickCount: explicitCase.tickCount } : {}),
        },
      ],
      statusReason: null,
      statusDetails: [] as string[],
    };
  }

  const sourceModule = project.modules.find((moduleInstance) => moduleInstance.id === sourceCandidate.moduleId);
  const sourceDef = sourceModule ? registry[sourceModule.defId] : null;
  const paramKey = sourceDef ? getPythonVerificationSourceParamKey(sourceDef.id) : null;
  if (!sourceModule || !sourceDef || !paramKey) {
    return {
      parityCases: [] as PythonExportParityCase[],
      statusReason: 'No supported primary parity source was found.',
      statusDetails: [] as string[],
    };
  }

  const inputValue = getPythonParityInputValue(sourceDef.id, sourceModule.params[paramKey]);
  const expectedOutput = hasStatefulModules
    ? collectTickedParityOutput(tickedExecution ?? { ticks: [], paramsByModuleByTick: {} }, sinkCandidate.moduleId)
    : sinkCandidate.formattedOutput;

  const derivedCase: PythonExportParityCase = {
    id: 'derived-export-parity-1',
    mode: hasStatefulModules ? 'ticked' : 'stateless',
    sourceModuleId: sourceCandidate.moduleId,
    sourceDefId: sourceCandidate.defId,
    sourceLabel: sourceCandidate.label,
    inputValue,
    expectedOutput,
    ...(hasStatefulModules
      ? { tickCount: derivePythonExportTickCount(project, registry) ?? undefined }
      : {}),
  };

  return {
    parityCases: [derivedCase],
    statusReason: null,
    statusDetails: [] as string[],
  };
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
    if (
      connection.to.port === 'clock' &&
      targetDef &&
      isStatefulModule(targetDef) &&
      !usesClockAsInput(targetDef)
    ) {
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

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, entryValue]) => `${JSON.stringify(key)}: ${toPythonLiteral(entryValue)}`,
    );
    return `{${entries.join(', ')}}`;
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
    hasParamOverride: (moduleId, key) => paramExpressionOverrides.has(`${moduleId}:${key}`),
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
    case 'AsciiSequenceInput':
      return `ascii_sequence_input(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'AsciiSequenceToBits':
      return `ascii_sequence_to_bits(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'AsciiCharToBits':
      return `ascii_char_to_bits(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'SymbolSequenceInput':
      return `symbol_sequence_input(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'BitSequenceInput':
      return `bit_sequence_input(${expressionContext.getParamExpression(moduleInstance, def, 'stream')})`;
    case 'KeyInput':
      return `key_input(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'AsciiSource':
      return `ascii_source(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'BaudotSource':
      return `baudot_source(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'BitSource':
      return `bit_source(${expressionContext.getParamExpression(moduleInstance, def, 'stream')})`;
    case 'ConstantBit':
      return `constant_bit(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'HexSource':
      return `hex_source(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'HexSequenceInput':
      return `hex_sequence_input(${expressionContext.getParamExpression(moduleInstance, def, 'value')})`;
    case 'HexSequenceToBits':
      return `hex_sequence_to_bits(${expressionContext.getInputExpression(moduleId, 'in')})`;
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
    case 'RepeatSymbolToLength':
      return `repeat_symbol_to_length(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'targetLength')})`;
    case 'PadSymbolToMatch':
      return `pad_symbol_to_match(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'reference')}, ${expressionContext.getParamExpression(moduleInstance, def, 'side')}, ${expressionContext.getParamExpression(moduleInstance, def, 'padChar')})`;
    case 'RequireSymbolLengthMatch':
      return `require_symbol_length_match(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'reference')})`;
    case 'RepeatSymbolToMatch':
      return `repeat_symbol_to_match(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'reference')})`;
    case 'TruncateSymbolToMatch':
      return `truncate_symbol_to_match(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'reference')}, ${expressionContext.getParamExpression(moduleInstance, def, 'side')})`;
    case 'TruncateSymbolSequence':
      return `truncate_symbol_sequence(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'targetLength')}, ${expressionContext.getParamExpression(moduleInstance, def, 'side')})`;
    case 'Reflector':
      return `{"out": reflector_traverse(${expressionContext.getInputExpression(moduleId, 'in')}, _parse_reflector_wiring(${expressionContext.getParamExpression(moduleInstance, def, 'wiring')}))}`;
    case 'Plugboard':
      return `plugboard_eval(${expressionContext.getInputExpression(moduleId, 'in')}, _parse_plugboard_wiring(${expressionContext.getParamExpression(moduleInstance, def, 'wiring')}))`;
    case 'BitsToSymbol':
      return `bits_to_symbol(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'PolluxFractionation':
      return `pollux_fractionation(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'zeroAlphabet')}, ${expressionContext.getParamExpression(moduleInstance, def, 'oneAlphabet')})`;
    case 'PolluxControlledFractionation':
      return `pollux_controlled_fractionation(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'select')}, ${expressionContext.getParamExpression(moduleInstance, def, 'zeroAlphabet')}, ${expressionContext.getParamExpression(moduleInstance, def, 'oneAlphabet')})`;
    case 'PolluxInverse':
      return `pollux_inverse(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'zeroAlphabet')}, ${expressionContext.getParamExpression(moduleInstance, def, 'oneAlphabet')})`;
    case 'BitsToAscii':
      return `bits_to_ascii(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'BitsToAsciiChar':
      return `bits_to_ascii_char(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'BitsToBaudot':
      return `bits_to_baudot(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'BitsToHex':
      return `bits_to_hex(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'BitsToHexDigit':
      return `bits_to_hex_digit(${expressionContext.getInputExpression(moduleId, 'in')})`;
    case 'HexDigitToBits':
      return `hex_digit_to_bits(${expressionContext.getInputExpression(moduleId, 'in')})`;
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
    case 'MultiSelector':
      return `multi_selector(${expressionContext.getInputExpression(moduleId, 'select')}, [${[
        'in0',
        'in1',
        'in2',
        'in3',
        'in4',
        'in5',
        'in6',
        'in7',
      ].map((inputName) => expressionContext.getInputExpression(moduleId, inputName)).join(', ')}], ${expressionContext.getParamExpression(moduleInstance, def, 'selectCount')})`;
    case 'SBox': {
      const inputBitsArgument =
        moduleInstance.params.inputBits !== undefined || expressionContext.hasParamOverride(moduleId, 'inputBits')
          ? expressionContext.getParamExpression(moduleInstance, def, 'inputBits')
          : 'None';
      const outputBitsArgument =
        moduleInstance.params.outputBits !== undefined || expressionContext.hasParamOverride(moduleId, 'outputBits')
          ? expressionContext.getParamExpression(moduleInstance, def, 'outputBits')
          : 'None';
      return `s_box(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'table')}, ${inputBitsArgument}, ${outputBitsArgument})`;
    }
    case 'AddMod':
      return `add_mod(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'SubMod':
      return `sub_mod(${expressionContext.getInputExpression(moduleId, 'a')}, ${expressionContext.getInputExpression(moduleId, 'b')})`;
    case 'ModExp':
      return `mod_exp(${expressionContext.getInputExpression(moduleId, 'base')}, ${expressionContext.getInputExpression(moduleId, 'exp')}, ${expressionContext.getParamExpression(moduleInstance, def, 'modulus')})`;
    case 'ModInverse':
      return `mod_inverse(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'modulus')})`;
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
    case 'BitSelect':
      return `bit_select(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'order')})`;
    case 'BitExpand':
      return `bit_expand(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'order')})`;
    case 'RepeatBitsToLength':
      return `repeat_bits_to_length(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'targetLength')})`;
    case 'PadBitsToMatch':
      return `pad_bits_to_match(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'reference')}, ${expressionContext.getParamExpression(moduleInstance, def, 'side')}, ${expressionContext.getParamExpression(moduleInstance, def, 'padBit')})`;
    case 'RequireBitsLengthMatch':
      return `require_bits_length_match(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'reference')})`;
    case 'RepeatBitsToMatch':
      return `repeat_bits_to_match(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'reference')})`;
    case 'BroadcastBits':
      return `broadcast_bits(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'copies')})`;
    case 'TruncateBitsToMatch':
      return `truncate_bits_to_match(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'reference')}, ${expressionContext.getParamExpression(moduleInstance, def, 'side')})`;
    case 'TruncateBitsSequence':
      return `truncate_bits_sequence(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'targetLength')}, ${expressionContext.getParamExpression(moduleInstance, def, 'side')})`;
    case 'PadBitsSequence':
      return `pad_bits_sequence(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getParamExpression(moduleInstance, def, 'targetLength')}, ${expressionContext.getParamExpression(moduleInstance, def, 'side')}, ${expressionContext.getParamExpression(moduleInstance, def, 'padBit')})`;
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

function buildSinkCaptureLines(
  moduleInstance: ModuleInstance,
  def: ModuleDefinition,
  expressionContext: PythonExpressionContext,
  indent = '    ',
  terminalOutputVariableName?: string,
) {
  const lines = [buildSinkCaptureLine(moduleInstance, def, expressionContext, indent)];
  if (terminalOutputVariableName) {
    lines.push(`${indent}${terminalOutputVariableName} = sink_outputs[-1][1]`);
  }
  return lines;
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
  compositeDefinitionStack = new Set<string>(),
  iteratorDefinitionStack = new Set<string>(),
): boolean {
  const roundDefinitionHasStatefulCandidate = (
    definition: ModuleDefinition,
    nestedIteratorDefinitionStack = iteratorDefinitionStack,
  ): boolean => {
    if (isCompositeDefinition(definition)) {
      if (compositeDefinitionStack.has(definition.id)) {
        return false;
      }
      const nextCompositeStack = new Set(compositeDefinitionStack);
      nextCompositeStack.add(definition.id);
      return projectHasStatefulExportCandidate(
        definition.project,
        registry,
        nextCompositeStack,
        nestedIteratorDefinitionStack,
      );
    }

    if (isIteratorDefinition(definition)) {
      if (nestedIteratorDefinitionStack.has(definition.id)) {
        return false;
      }
      const roundDef = registry[definition.roundDefId];
      if (!roundDef) {
        return false;
      }
      const nextIteratorStack = new Set(nestedIteratorDefinitionStack);
      nextIteratorStack.add(definition.id);
      return roundDefinitionHasStatefulCandidate(roundDef, nextIteratorStack);
    }

    return SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS.has(definition.id);
  };

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def) {
      continue;
    }

    if (isCompositeDefinition(def)) {
      if (compositeDefinitionStack.has(def.id)) {
        continue;
      }
      const internalProject = applyForwardedCompositeParamsForExport(def, moduleInstance.params);
      const nextStack = new Set(compositeDefinitionStack);
      nextStack.add(def.id);
      if (projectHasStatefulExportCandidate(internalProject, registry, nextStack, iteratorDefinitionStack)) {
        return true;
      }
      continue;
    }

    if (isIteratorDefinition(def)) {
      const roundDef = registry[def.roundDefId];
      if (roundDef && roundDefinitionHasStatefulCandidate(roundDef, new Set(iteratorDefinitionStack).add(def.id))) {
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
  compositeDefinitionStack = new Set<string>(),
): number | null {
  let minLength = deriveTickCount(project, registry);

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def || !isCompositeDefinition(def) || compositeDefinitionStack.has(def.id)) {
      continue;
    }

    const internalProject = applyForwardedCompositeParamsForExport(def, moduleInstance.params);
    const nextStack = new Set(compositeDefinitionStack);
    nextStack.add(def.id);
    const internalTickCount = derivePythonExportTickCount(
      internalProject,
      registry,
      nextStack,
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
  compositeDefinitionPath: string[] = [],
  allowIteratorsInCompositeBodies = compositeDepth === 0,
): PythonExportCompatibilityIssue[] {
  const issues: PythonExportCompatibilityIssue[] = [];
  const collectIteratorRoundDefinitionIssues = (
    iteratorDef: IteratorDef,
    scopedModuleId: string,
    iteratorDefinitionPath: string[] = [],
  ): PythonExportCompatibilityIssue[] => {
    if (iteratorDefinitionPath.includes(iteratorDef.id)) {
      return [
        {
          moduleId: scopedModuleId,
          defId: iteratorDef.id,
          reason: 'Iterator definition cycles are not exportable in V1.',
        },
      ];
    }

    const roundDef = registry[iteratorDef.roundDefId];
    if (!roundDef) {
      return [
        {
          moduleId: scopedModuleId,
          defId: iteratorDef.id,
          reason: `Iterator round definition "${iteratorDef.roundDefId}" is unknown.`,
        },
      ];
    }

    const nextIteratorDefinitionPath = [...iteratorDefinitionPath, iteratorDef.id];

    if (isIteratorDefinition(roundDef)) {
      return collectIteratorRoundDefinitionIssues(roundDef, scopedModuleId, nextIteratorDefinitionPath);
    }

    if (isCompositeDefinition(roundDef)) {
      const internalProject = applyForwardedCompositeParamsForExport(roundDef, {});
      return collectPythonExportCompatibilityIssues(
        internalProject,
        registry,
        `${scopedModuleId}/round-def`,
        1,
        [...compositeDefinitionPath, roundDef.id],
        true,
      );
    }

    if (isStatefulModule(roundDef) && !SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS.has(roundDef.id)) {
      return [
        {
          moduleId: scopedModuleId,
          defId: iteratorDef.id,
          reason: 'This iterator round definition is outside the Python export stateful supported subset.',
        },
      ];
    }

    if (!SUPPORTED_PYTHON_EXPORT_DEF_IDS.has(roundDef.id)) {
      return [
        {
          moduleId: scopedModuleId,
          defId: iteratorDef.id,
          reason: 'This iterator round definition is outside the Python export V1 supported subset.',
        },
      ];
    }

    return [];
  };
  const hasStatefulSupportCandidate = projectHasStatefulExportCandidate(
    project,
    registry,
    new Set(compositeDefinitionPath),
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
      if (compositeDefinitionPath.includes(def.id)) {
        issues.push({
          moduleId: scopedModuleId,
          defId: moduleInstance.defId,
          reason: 'Composite definition cycles are not exportable in V1.',
        });
        continue;
      }
      const internalProject = applyForwardedCompositeParamsForExport(def, moduleInstance.params);
      const nextDefinitionPath = [...compositeDefinitionPath, def.id];
      issues.push(
        ...collectPythonExportCompatibilityIssues(
          internalProject,
          registry,
          scopedModuleId,
          compositeDepth + 1,
          nextDefinitionPath,
          allowIteratorsInCompositeBodies,
        ),
      );
      continue;
    }

    if (isIteratorDefinition(def)) {
      if (compositeDepth > 0 && !allowIteratorsInCompositeBodies) {
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

      issues.push(...collectIteratorRoundDefinitionIssues(def, scopedModuleId));
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
    derivePythonExportTickCount(project, registry, new Set(compositeDefinitionPath)) === null
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
  const context: CompositeCollectionContext = {
    orderedDefs: [],
    definitionsById: new Map(),
  };
  const visiting = new Set<string>();
  const visitedIteratorDefs = new Set<string>();

  const registerCompositeDefinition = (def: CompositeDef) => {
    if (context.definitionsById.has(def.id)) {
      return;
    }
    if (visiting.has(def.id)) {
      throw new Error(`Python export detected a composite definition cycle at "${def.id}".`);
    }
    visiting.add(def.id);

    try {
      const childCompositeIds = Array.from(
        new Set(
          def.project.modules
            .flatMap((moduleInstance) => {
              const candidate = registry[moduleInstance.defId];
              if (candidate && isCompositeDefinition(candidate)) {
                return [candidate];
              }
              if (candidate && isIteratorDefinition(candidate)) {
                const roundDef = registry[candidate.roundDefId];
                if (roundDef && isCompositeDefinition(roundDef)) {
                  return [roundDef];
                }
              }
              return [];
            })
            .map((candidate) => candidate.id),
        ),
      ).sort((left, right) => left.localeCompare(right));

      for (const childCompositeId of childCompositeIds) {
        const childDef = registry[childCompositeId];
        if (childDef && isCompositeDefinition(childDef)) {
          registerCompositeDefinition(childDef);
        }
      }

      const inputArgNames = buildPythonNameMap(
        def.inputs.map((input) => input.name),
        'input',
      );
      const forwardedArgNames = buildPythonNameMap(
        getCompositeForwardedParamKeys(def),
        'param',
      );

      const definition: CompositeExportDefinition = {
        def,
        functionName: `composite_${sanitizeIdentifierPart(def.id)}`,
        stateful: projectHasStatefulExportCandidate(def.project, registry, new Set([def.id])),
        inputArgNames,
        forwardedArgNames,
      };

      context.definitionsById.set(def.id, definition);
      context.orderedDefs.push(def);
    } finally {
      visiting.delete(def.id);
    }
  };

  const visitIteratorRoundDefinition = (iteratorDef: IteratorDef) => {
    if (visitedIteratorDefs.has(iteratorDef.id)) {
      return;
    }
    visitedIteratorDefs.add(iteratorDef.id);

    const roundDef = registry[iteratorDef.roundDefId];
    if (!roundDef) {
      return;
    }

    if (isCompositeDefinition(roundDef)) {
      registerCompositeDefinition(roundDef);
      return;
    }

    if (isIteratorDefinition(roundDef)) {
      visitIteratorRoundDefinition(roundDef);
    }
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
      visitIteratorRoundDefinition(def);
    }
  }

  return context.orderedDefs.map((def) => {
    const definition = context.definitionsById.get(def.id);
    if (!definition) {
      throw new Error(`Python export could not resolve composite definition "${def.id}".`);
    }
    return definition;
  });
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
    args.push(expressionContext.getParamExpression(moduleInstance, compositeDefinition.def, forwardedParamKey));
  }

  return args;
}

function buildIteratorLookupKey(
  moduleInstanceId: string,
  ownerCompositeDefId?: string,
) {
  return ownerCompositeDefId ? `${ownerCompositeDefId}:${moduleInstanceId}` : moduleInstanceId;
}

function buildIteratorDefinitionLookupKey(
  iteratorDefId: string,
) {
  return `def:${iteratorDefId}`;
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

function buildIteratorRoundCallArguments(
  roundDef: ModuleDefinition,
  iteratorId: string,
  roundInputExpression: string,
  roundKeyExpression: string | null,
): string[] {
  return roundDef.inputs.map((input) => {
    if (input.name === 'in') {
      return roundInputExpression;
    }
    if (input.name === 'key') {
      if (!roundKeyExpression) {
        throw new Error(`Python export could not resolve keyed iterator input for "${iteratorId}".`);
      }
      return roundKeyExpression;
    }
    throw new Error(`Python export does not support iterator round input "${input.name}" for "${iteratorId}".`);
  });
}

function buildCompositeHelperDefinitions(
  compositeDefinitions: CompositeExportDefinition[],
  registry: ModuleRegistry,
  iteratorDefinitionsByLookupKey: Map<string, IteratorExportDefinition>,
) {
  const helperBlocks: string[] = [];
  const compositeDefinitionsById = new Map(
    compositeDefinitions.map((definition) => [definition.def.id, definition]),
  );

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
        if (!def) {
          throw new Error(`Python export encountered unsupported composite definition "${moduleInstance.defId}".`);
        }

        const variableName = variablesByModuleId.get(moduleId);
        if (!variableName) {
          throw new Error(`Python export could not resolve composite variable for "${moduleId}".`);
        }

        if (SYMBOL_SINK_DEF_IDS.has(def.id) || BIT_SINK_DEF_IDS.has(def.id) || HEX_SINK_DEF_IDS.has(def.id)) {
          bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '    ', 'Sink'));
          bodyLines.push('    pass');
          continue;
        }

        if (isCompositeDefinition(def)) {
          const childDefinition = compositeDefinitionsById.get(def.id);
          if (!childDefinition) {
            throw new Error(`Python export could not resolve nested composite helper for "${def.id}".`);
          }
          const callArguments = buildCompositeCallArguments(
            moduleInstance,
            childDefinition,
            expressionContext,
          );
          bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
          bodyLines.push(
            `    ${variableName} = ${childDefinition.functionName}(${callArguments.join(', ')})`,
          );
          continue;
        }

        if (isIteratorDefinition(def)) {
          const iteratorDefinition = iteratorDefinitionsByLookupKey.get(
            buildIteratorLookupKey(moduleInstance.id, compositeDefinition.def.id),
          );
          if (!iteratorDefinition) {
            throw new Error(`Python export could not resolve nested iterator helper for "${moduleInstance.id}".`);
          }
          const callArguments = buildIteratorCallArguments(
            iteratorDefinition,
            expressionContext,
            moduleInstance,
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
      if (!def) {
        continue;
      }
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve composite state variable for "${moduleInstance.id}".`);
      }

      if (isCompositeDefinition(def)) {
        const childDefinition = compositeDefinitionsById.get(def.id);
        if (childDefinition?.stateful) {
          const forwardedArgs = getCompositeForwardedParamKeys(def).map((paramKey) =>
            expressionContext.getParamExpression(moduleInstance, def, paramKey),
          );
          initLines.push(
            buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
            `    state[${JSON.stringify(variableName)}] = ${childDefinition.functionName}_init_state(${forwardedArgs.join(', ')})`,
          );
        }
      } else if (isIteratorDefinition(def)) {
        const iteratorDefinition = iteratorDefinitionsByLookupKey.get(
          buildIteratorLookupKey(moduleInstance.id, compositeDefinition.def.id),
        );
        if (iteratorDefinition?.stateful) {
          const initArgs = buildIteratorStateInitArguments(
            iteratorDefinition,
            expressionContext,
            moduleInstance,
          );
          initLines.push(
            buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
            `    state[${JSON.stringify(variableName)}] = ${iteratorDefinition.functionName}_init_state(${initArgs.join(', ')})`,
          );
        }
      } else if (def.id === 'Counter') {
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
      } else if (def.id === 'TickedSymbolsToSequence') {
        initLines.push(
          buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
          `    state[${JSON.stringify(variableName)}] = ticked_symbols_to_sequence_init(${expressionContext.getParamExpression(moduleInstance, def, 'collected')}, ${expressionContext.getParamExpression(moduleInstance, def, 'count')})`,
        );
      } else if (def.id === 'TickedBitsToSequence') {
        initLines.push(
          buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
          `    state[${JSON.stringify(variableName)}] = ticked_bits_to_sequence_init(${expressionContext.getParamExpression(moduleInstance, def, 'collected')}, ${expressionContext.getParamExpression(moduleInstance, def, 'count')})`,
        );
      } else if (def.id === 'AsciiSequenceToTicked') {
        initLines.push(
          buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
          `    state[${JSON.stringify(variableName)}] = ascii_sequence_to_ticked_init(${expressionContext.getParamExpression(moduleInstance, def, 'index')}, ${expressionContext.getParamExpression(moduleInstance, def, 'wrap')})`,
        );
      } else if (def.id === 'SymbolSequenceToTicked') {
        initLines.push(
          buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
          `    state[${JSON.stringify(variableName)}] = symbol_sequence_to_ticked_init(${expressionContext.getParamExpression(moduleInstance, def, 'index')}, ${expressionContext.getParamExpression(moduleInstance, def, 'wrap')})`,
        );
      } else if (def.id === 'BitsSequenceToTicked') {
        initLines.push(
          buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
          `    state[${JSON.stringify(variableName)}] = bits_sequence_to_ticked_init(${expressionContext.getParamExpression(moduleInstance, def, 'index')}, ${expressionContext.getParamExpression(moduleInstance, def, 'wordWidth')}, ${expressionContext.getParamExpression(moduleInstance, def, 'wrap')}, ${expressionContext.getParamExpression(moduleInstance, def, 'remainderMode')})`,
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
      if (!def) {
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

      if (isCompositeDefinition(def)) {
        const childDefinition = compositeDefinitionsById.get(def.id);
        if (!childDefinition) {
          throw new Error(`Python export could not resolve nested composite helper for "${def.id}".`);
        }
        const callArguments = buildCompositeCallArguments(
          moduleInstance,
          childDefinition,
          expressionContext,
        );
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        if (childDefinition.stateful) {
          tickLines.push(
            `    ${variableName} = ${childDefinition.functionName}_tick(state[${JSON.stringify(variableName)}], tick${callArguments.length > 0 ? `, ${callArguments.join(', ')}` : ''})`,
          );
        } else {
          tickLines.push(
            `    ${variableName} = ${childDefinition.functionName}(${callArguments.join(', ')})`,
          );
        }
        continue;
      }

      if (isIteratorDefinition(def)) {
        const iteratorDefinition = iteratorDefinitionsByLookupKey.get(
          buildIteratorLookupKey(moduleInstance.id, compositeDefinition.def.id),
        );
        if (!iteratorDefinition) {
          throw new Error(`Python export could not resolve nested iterator helper for "${moduleInstance.id}".`);
        }
        const callArguments = buildIteratorCallArguments(
          iteratorDefinition,
          expressionContext,
          moduleInstance,
        );
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        if (iteratorDefinition.stateful) {
          tickLines.push(
            `    ${variableName} = ${iteratorDefinition.functionName}_tick(state[${JSON.stringify(variableName)}], tick${callArguments.length > 0 ? `, ${callArguments.join(', ')}` : ''})`,
          );
        } else {
          tickLines.push(
            `    ${variableName} = ${iteratorDefinition.functionName}(${callArguments.join(', ')})`,
          );
        }
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

      if (def.id === 'TickedSymbolsToSequence') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = ticked_symbols_to_sequence_eval(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'clock')}, state[${JSON.stringify(variableName)}])`,
        );
        continue;
      }

      if (def.id === 'TickedBitsToSequence') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = ticked_bits_to_sequence_eval(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'clock')}, state[${JSON.stringify(variableName)}])`,
        );
        continue;
      }

      if (def.id === 'AsciiSequenceToTicked') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = ascii_sequence_to_ticked_eval(${expressionContext.getInputExpression(moduleId, 'in')}, state[${JSON.stringify(variableName)}])`,
        );
        continue;
      }

      if (def.id === 'SymbolSequenceToTicked') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = symbol_sequence_to_ticked_eval(${expressionContext.getInputExpression(moduleId, 'in')}, state[${JSON.stringify(variableName)}])`,
        );
        continue;
      }

      if (def.id === 'BitsSequenceToTicked') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = bits_sequence_to_ticked_eval(${expressionContext.getInputExpression(moduleId, 'in')}, state[${JSON.stringify(variableName)}])`,
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

      if (def.id === 'BaudotSource') {
        tickLines.push(buildGeneratedModuleComment(moduleInstance, def, '    '));
        tickLines.push(
          `    ${variableName} = baudot_source_tick(${expressionContext.getParamExpression(moduleInstance, def, 'value')}, tick)`,
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
      if (!def || (def.id !== 'Counter' && def.id !== 'LFSR' && def.id !== 'Rotor' && def.id !== 'TickedSymbolsToSequence' && def.id !== 'TickedBitsToSequence' && def.id !== 'AsciiSequenceToTicked' && def.id !== 'SymbolSequenceToTicked' && def.id !== 'BitsSequenceToTicked')) {
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
      if (!def || (def.id !== 'Counter' && def.id !== 'LFSR' && def.id !== 'Rotor' && def.id !== 'TickedSymbolsToSequence' && def.id !== 'TickedBitsToSequence' && def.id !== 'AsciiSequenceToTicked' && def.id !== 'SymbolSequenceToTicked' && def.id !== 'BitsSequenceToTicked')) {
        continue;
      }

      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve composite state variable for "${moduleInstance.id}".`);
      }

      const stepFlagName = `step_${variableName}`;
      const advanceCall =
        def.id === 'Counter'
          ? `counter_advance(state[${JSON.stringify(variableName)}])`
          : def.id === 'LFSR'
            ? `lfsr_advance(state[${JSON.stringify(variableName)}])`
            : def.id === 'Rotor'
              ? `rotor_advance(state[${JSON.stringify(variableName)}])`
              : def.id === 'TickedSymbolsToSequence'
                ? `ticked_symbols_to_sequence_advance(${expressionContext.getInputExpression(moduleInstance.id, 'in')}, ${expressionContext.getInputExpression(moduleInstance.id, 'clock')}, state[${JSON.stringify(variableName)}])`
                : def.id === 'TickedBitsToSequence'
                  ? `ticked_bits_to_sequence_advance(${expressionContext.getInputExpression(moduleInstance.id, 'in')}, ${expressionContext.getInputExpression(moduleInstance.id, 'clock')}, state[${JSON.stringify(variableName)}])`
                  : def.id === 'AsciiSequenceToTicked'
                    ? `ascii_sequence_to_ticked_advance(state[${JSON.stringify(variableName)}])`
                    : def.id === 'BitsSequenceToTicked'
                      ? `bits_sequence_to_ticked_advance(state[${JSON.stringify(variableName)}])`
                      : `symbol_sequence_to_ticked_advance(state[${JSON.stringify(variableName)}])`;
      tickLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'Advance'),
        `    if ${stepFlagName}:`,
        `        ${advanceCall}`,
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
  const orderedDefinitions: IteratorExportDefinition[] = [];
  const definitionsByKey = new Map<string, IteratorExportDefinition>();
  const visitedCompositeDefs = new Set<string>();
  const visitedIteratorDefs = new Set<string>();
  const visitingIteratorDefs = new Set<string>();

  const isIteratorRoundStateful = (
    roundDef: ModuleDefinition,
    iteratorPath: Set<string> = new Set(),
  ): boolean => {
    if (isCompositeDefinition(roundDef)) {
      return projectHasStatefulExportCandidate(roundDef.project, registry, new Set([roundDef.id]));
    }
    if (isIteratorDefinition(roundDef)) {
      if (iteratorPath.has(roundDef.id)) {
        throw new Error(`Python export encountered cyclic iterator round definitions at "${roundDef.id}".`);
      }
      const nestedRoundDef = registry[roundDef.roundDefId];
      if (!nestedRoundDef) {
        throw new Error(`Python export could not resolve iterator round definition "${roundDef.roundDefId}".`);
      }
      const nextPath = new Set(iteratorPath);
      nextPath.add(roundDef.id);
      return isIteratorRoundStateful(nestedRoundDef, nextPath);
    }
    return SUPPORTED_STATEFUL_PYTHON_EXPORT_DEF_IDS.has(roundDef.id);
  };

  const registerIteratorDefinition = (
    moduleInstance: ModuleInstance,
    def: IteratorDef,
    roundDef: ModuleDefinition,
    ownerCompositeDefId?: string,
  ) => {
    const lookupKey = buildIteratorLookupKey(moduleInstance.id, ownerCompositeDefId);
    if (definitionsByKey.has(lookupKey)) {
      return;
    }

    const iteratorDefinition: IteratorExportDefinition = {
      lookupKey,
      moduleInstance,
      def,
      roundDef,
      functionName: ownerCompositeDefId
        ? `iterator_${sanitizeIdentifierPart(ownerCompositeDefId)}_${sanitizeIdentifierPart(moduleInstance.id)}`
        : `iterator_${sanitizeIdentifierPart(moduleInstance.id)}`,
      resolvedIterationCount: getResolvedIteratorIterationCount(def, moduleInstance.params),
      stateful: isIteratorRoundStateful(roundDef),
      inputArgNames: buildPythonNameMap(
        def.inputs.map((input) => input.name),
        'input',
      ),
      ownerCompositeDefId,
      iterationCountArgName: ownerCompositeDefId ? 'param_iterationCount' : undefined,
      sourceLabel: moduleInstance.id,
      definitionHelper: false,
    };
    definitionsByKey.set(lookupKey, iteratorDefinition);
    orderedDefinitions.push(iteratorDefinition);
  };

  const registerDefinitionIterator = (
    def: IteratorDef,
    roundDef: ModuleDefinition,
  ) => {
    const lookupKey = buildIteratorDefinitionLookupKey(def.id);
    if (definitionsByKey.has(lookupKey)) {
      return;
    }

    const iteratorDefinition: IteratorExportDefinition = {
      lookupKey,
      moduleInstance: { id: `def-${def.id}`, defId: def.id, params: {} },
      def,
      roundDef,
      functionName: `iterator_def_${sanitizeIdentifierPart(def.id)}`,
      resolvedIterationCount: def.iterationCount,
      stateful: isIteratorRoundStateful(roundDef),
      inputArgNames: buildPythonNameMap(
        def.inputs.map((input) => input.name),
        'input',
      ),
      sourceLabel: `definition:${def.id}`,
      definitionHelper: true,
    };
    definitionsByKey.set(lookupKey, iteratorDefinition);
    orderedDefinitions.push(iteratorDefinition);
  };

  const visitIteratorDefinition = (iteratorDef: IteratorDef) => {
    if (visitedIteratorDefs.has(iteratorDef.id)) {
      return;
    }
    if (visitingIteratorDefs.has(iteratorDef.id)) {
      throw new Error(`Python export encountered cyclic iterator round definitions at "${iteratorDef.id}".`);
    }
    visitingIteratorDefs.add(iteratorDef.id);

    const roundDef = registry[iteratorDef.roundDefId];
    if (!roundDef) {
      visitingIteratorDefs.delete(iteratorDef.id);
      return;
    }

    if (isIteratorDefinition(roundDef)) {
      visitIteratorDefinition(roundDef);
    } else if (isCompositeDefinition(roundDef)) {
      visitCompositeDefinition(roundDef);
    }

    registerDefinitionIterator(iteratorDef, roundDef);
    visitingIteratorDefs.delete(iteratorDef.id);
    visitedIteratorDefs.add(iteratorDef.id);
  };

  const visitCompositeDefinition = (compositeDef: CompositeDef) => {
    if (visitedCompositeDefs.has(compositeDef.id)) {
      return;
    }
    visitedCompositeDefs.add(compositeDef.id);

    for (const moduleInstance of compositeDef.project.modules) {
      const def = registry[moduleInstance.defId];
      if (!def) {
        continue;
      }
      if (isCompositeDefinition(def)) {
        visitCompositeDefinition(def);
        continue;
      }
      if (!isIteratorDefinition(def)) {
        continue;
      }

      const roundDef = registry[def.roundDefId];
      if (!roundDef) {
        continue;
      }

      if (isIteratorDefinition(roundDef)) {
        visitIteratorDefinition(roundDef);
      } else if (isCompositeDefinition(roundDef)) {
        visitCompositeDefinition(roundDef);
      }

      registerIteratorDefinition(moduleInstance, def, roundDef, compositeDef.id);
    }
  };

  for (const moduleInstance of project.modules) {
    const def = registry[moduleInstance.defId];
    if (!def) {
      continue;
    }

    if (isCompositeDefinition(def)) {
      visitCompositeDefinition(def);
      continue;
    }

    if (!isIteratorDefinition(def)) {
      continue;
    }

    const roundDef = registry[def.roundDefId];
    if (!roundDef) {
      continue;
    }

    if (isIteratorDefinition(roundDef)) {
      visitIteratorDefinition(roundDef);
    } else if (isCompositeDefinition(roundDef)) {
      visitCompositeDefinition(roundDef);
    }

    registerIteratorDefinition(moduleInstance, def, roundDef);
  }

  return orderedDefinitions;
}

function buildIteratorFunctionArgumentList(
  iteratorDefinition: IteratorExportDefinition,
) {
  const inputArgs = iteratorDefinition.def.inputs.map(
    (input) =>
      iteratorDefinition.inputArgNames.get(input.name) ?? sanitizeIdentifierPart(input.name),
  );
  const paramArgs = iteratorDefinition.iterationCountArgName
    ? [iteratorDefinition.iterationCountArgName]
    : [];

  return {
    inputArgs,
    paramArgs,
    allArgs: [...inputArgs, ...paramArgs],
  };
}

function buildIteratorCallArguments(
  iteratorDefinition: IteratorExportDefinition,
  expressionContext: PythonExpressionContext,
  moduleInstance: ModuleInstance = iteratorDefinition.moduleInstance,
) {
  const args = iteratorDefinition.def.inputs.map((input) =>
    expressionContext.getInputExpression(moduleInstance.id, input.name),
  );

  if (iteratorDefinition.iterationCountArgName) {
    args.push(expressionContext.getParamExpression(moduleInstance, iteratorDefinition.def, 'iterationCount'));
  }

  return args;
}

function buildIteratorStateInitArguments(
  iteratorDefinition: IteratorExportDefinition,
  expressionContext: PythonExpressionContext,
  moduleInstance: ModuleInstance = iteratorDefinition.moduleInstance,
) {
  if (!iteratorDefinition.iterationCountArgName) {
    return [];
  }

  return [expressionContext.getParamExpression(moduleInstance, iteratorDefinition.def, 'iterationCount')];
}

function buildIteratorRoundExpression(
  iteratorDefinition: IteratorExportDefinition,
  roundDef: ModuleDefinition,
  roundModuleId: string,
  roundInputExpression: string,
  roundKeyExpression: string | null,
  compositeDefinitionsById: Map<string, CompositeExportDefinition>,
  iteratorDefinitionsByLookupKey: Map<string, IteratorExportDefinition>,
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

  if (isIteratorDefinition(roundDef)) {
    const nestedIteratorDefinition = iteratorDefinitionsByLookupKey.get(
      buildIteratorDefinitionLookupKey(roundDef.id),
    );
    if (!nestedIteratorDefinition) {
      throw new Error(`Python export could not resolve nested iterator definition helper for "${roundDef.id}".`);
    }
    const args = buildIteratorRoundCallArguments(
      roundDef,
      iteratorDefinition.def.id,
      roundInputExpression,
      roundKeyExpression,
    );
    return `${nestedIteratorDefinition.functionName}(${args.join(', ')})`;
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
  const iteratorDefinitionsByLookupKey = new Map(
    iteratorDefinitions.map((definition) => [definition.lookupKey, definition]),
  );

  for (const iteratorDefinition of iteratorDefinitions) {
    const args = buildIteratorFunctionArgumentList(iteratorDefinition);
    const inputName = iteratorDefinition.inputArgNames.get('in');
    if (!inputName) {
      throw new Error(`Python export requires iterator "${iteratorDefinition.def.id}" to expose an "in" input.`);
    }

    const roundDef = iteratorDefinition.roundDef;
    const keyInputName = iteratorDefinition.inputArgNames.get('key') ?? null;
    const keyBitsName = keyInputName ? `${sanitizeIdentifierPart(keyInputName)}_bits` : null;
    const iterationCountName = iteratorDefinition.iterationCountArgName;

    if (iterationCountName) {
      if (!iteratorDefinition.stateful) {
        const bodyLines: string[] = [
          `def ${iteratorDefinition.functionName}(${args.allArgs.join(', ')}):`,
          `    # Iterator helper: ${iteratorDefinition.def.id} [${iteratorDefinition.sourceLabel}]`,
          `    iteration_count = _require_positive_int(${iterationCountName}, "iterationCount", ${JSON.stringify(iteratorDefinition.def.id)})`,
        ];

        if (iteratorDefinition.def.roundKeyWidth !== undefined) {
          if (!keyInputName || !keyBitsName) {
            throw new Error(`Python export requires keyed iterator "${iteratorDefinition.def.id}" to expose a "key" input.`);
          }
          bodyLines.push(
            `    ${keyBitsName} = _expect_bits(${keyInputName}, ${JSON.stringify(iteratorDefinition.def.id)})`,
            `    if len(${keyBitsName}) != iteration_count * ${iteratorDefinition.def.roundKeyWidth}:`,
            `        raise ValueError(${JSON.stringify(`Iterator "${iteratorDefinition.def.id}" requires a key bus of exactly iterationCount * roundKeyWidth bits.`)})`,
          );
        }

        bodyLines.push(`    previous_round = ${inputName}`, '    for round_index in range(iteration_count):');

        const roundKeyExpression =
          iteratorDefinition.def.roundKeyWidth !== undefined && keyBitsName
            ? `${keyBitsName}[round_index * ${iteratorDefinition.def.roundKeyWidth}:(round_index + 1) * ${iteratorDefinition.def.roundKeyWidth}]`
            : null;
        bodyLines.push(
          `        # Round ${'${round_index + 1}'}: ${iteratorDefinition.def.roundDefId}`.replace("${'${round_index + 1}'}", '{round_index + 1}'),
          `        round_result = ${buildIteratorRoundExpression(
            iteratorDefinition,
            roundDef,
            'round-runtime',
            'previous_round',
            roundKeyExpression,
            compositeDefinitionsById,
            iteratorDefinitionsByLookupKey,
          )}`,
          '        previous_round = round_result["out"]',
          '    return {"out": previous_round}',
        );

        helperBlocks.push(bodyLines.join('\n'));
        continue;
      }

      const initLines: string[] = [
        `def ${iteratorDefinition.functionName}_init_state(${args.paramArgs.join(', ')}):`,
        `    # Iterator state init: ${iteratorDefinition.def.id} [${iteratorDefinition.sourceLabel}]`,
        `    iteration_count = _require_positive_int(${iterationCountName}, "iterationCount", ${JSON.stringify(iteratorDefinition.def.id)})`,
        '    state = []',
        '    for round_index in range(iteration_count):',
      ];

      if (isCompositeDefinition(roundDef)) {
        const compositeDefinition = compositeDefinitionsById.get(roundDef.id);
        if (!compositeDefinition) {
          throw new Error(`Python export could not resolve stateful composite round helper for "${roundDef.id}".`);
        }
        const forwardedArgs = getCompositeForwardedParamKeys(roundDef).map((paramKey) =>
          getDefaultParamExpression(
            { id: 'round-runtime', defId: roundDef.id, params: {} },
            roundDef,
            paramKey,
          ),
        );
        initLines.push(
          `        state.append(${compositeDefinition.functionName}_init_state(${forwardedArgs.join(', ')}))`,
        );
      } else if (isIteratorDefinition(roundDef)) {
        const nestedIteratorDefinition = iteratorDefinitionsByLookupKey.get(
          buildIteratorDefinitionLookupKey(roundDef.id),
        );
        if (!nestedIteratorDefinition) {
          throw new Error(`Python export could not resolve nested iterator definition helper for "${roundDef.id}".`);
        }
        initLines.push(
          `        state.append(${nestedIteratorDefinition.functionName}_init_state())`,
        );
      } else if (roundDef.id === 'Rotor') {
        initLines.push(
          `        state.append(rotor_init(${toPythonLiteral(getResolvedParamValue({ id: 'round-runtime', defId: roundDef.id, params: {} }, roundDef, 'wiring'))}, ${toPythonLiteral(getResolvedParamValue({ id: 'round-runtime', defId: roundDef.id, params: {} }, roundDef, 'position'))}, ${toPythonLiteral(getResolvedParamValue({ id: 'round-runtime', defId: roundDef.id, params: {} }, roundDef, 'ringOffset'))}, ${toPythonLiteral(getResolvedParamValue({ id: 'round-runtime', defId: roundDef.id, params: {} }, roundDef, 'notches'))}))`,
        );
      } else {
        throw new Error(`Python export does not support temporal iterator round "${roundDef.id}".`);
      }
      initLines.push('    return state');

      const tickLines: string[] = [
        `def ${iteratorDefinition.functionName}_tick(state, tick${args.allArgs.length > 0 ? `, ${args.allArgs.join(', ')}` : ''}):`,
        `    # Iterator helper: ${iteratorDefinition.def.id} [${iteratorDefinition.sourceLabel}]`,
        `    iteration_count = _require_positive_int(${iterationCountName}, "iterationCount", ${JSON.stringify(iteratorDefinition.def.id)})`,
        '    if len(state) != iteration_count:',
        `        raise ValueError(${JSON.stringify(`Iterator "${iteratorDefinition.def.id}" state does not match iterationCount.`)})`,
      ];

      if (iteratorDefinition.def.roundKeyWidth !== undefined) {
        if (!keyInputName || !keyBitsName) {
          throw new Error(`Python export requires keyed iterator "${iteratorDefinition.def.id}" to expose a "key" input.`);
        }
        tickLines.push(
          `    ${keyBitsName} = _expect_bits(${keyInputName}, ${JSON.stringify(iteratorDefinition.def.id)})`,
          `    if len(${keyBitsName}) != iteration_count * ${iteratorDefinition.def.roundKeyWidth}:`,
          `        raise ValueError(${JSON.stringify(`Iterator "${iteratorDefinition.def.id}" requires a key bus of exactly iterationCount * roundKeyWidth bits.`)})`,
        );
      }

      tickLines.push(`    previous_round = ${inputName}`, '    for round_index in range(iteration_count):');
      const dynamicRoundKeyExpression =
        iteratorDefinition.def.roundKeyWidth !== undefined && keyBitsName
          ? `${keyBitsName}[round_index * ${iteratorDefinition.def.roundKeyWidth}:(round_index + 1) * ${iteratorDefinition.def.roundKeyWidth}]`
          : null;

      if (isCompositeDefinition(roundDef)) {
        const compositeDefinition = compositeDefinitionsById.get(roundDef.id);
        if (!compositeDefinition) {
          throw new Error(`Python export could not resolve stateful composite round helper for "${roundDef.id}".`);
        }
        const roundArgs = buildIteratorRoundCallArguments(
          roundDef,
          iteratorDefinition.def.id,
          'previous_round',
          dynamicRoundKeyExpression,
        );
        for (const forwardedParamKey of getCompositeForwardedParamKeys(roundDef)) {
          roundArgs.push(
            getDefaultParamExpression(
              { id: 'round-runtime', defId: roundDef.id, params: {} },
              roundDef,
              forwardedParamKey,
            ),
          );
        }
        tickLines.push(
          `        # Round {round_index + 1}: ${iteratorDefinition.def.roundDefId}`,
          `        round_result = ${compositeDefinition.functionName}_tick(state[round_index], tick${roundArgs.length > 0 ? `, ${roundArgs.join(', ')}` : ''})`,
          '        previous_round = round_result["out"]',
        );
      } else if (isIteratorDefinition(roundDef)) {
        const nestedIteratorDefinition = iteratorDefinitionsByLookupKey.get(
          buildIteratorDefinitionLookupKey(roundDef.id),
        );
        if (!nestedIteratorDefinition) {
          throw new Error(`Python export could not resolve nested iterator definition helper for "${roundDef.id}".`);
        }
        const roundArgs = buildIteratorRoundCallArguments(
          roundDef,
          iteratorDefinition.def.id,
          'previous_round',
          dynamicRoundKeyExpression,
        );
        tickLines.push(
          `        # Round {round_index + 1}: ${iteratorDefinition.def.roundDefId}`,
          `        round_result = ${nestedIteratorDefinition.functionName}_tick(state[round_index], tick${roundArgs.length > 0 ? `, ${roundArgs.join(', ')}` : ''})`,
          '        previous_round = round_result["out"]',
        );
      } else {
        tickLines.push(
          `        # Round {round_index + 1}: ${iteratorDefinition.def.roundDefId}`,
          '        round_result = rotor_eval(previous_round, state[round_index])',
          '        previous_round = round_result["out"]',
          '        rotor_advance(state[round_index])',
        );
      }

      tickLines.push('    return {"out": previous_round}');
      helperBlocks.push(initLines.join('\n'));
      helperBlocks.push(tickLines.join('\n'));
      continue;
    }

    if (!iteratorDefinition.stateful) {
      const bodyLines: string[] = [
        `def ${iteratorDefinition.functionName}(${args.allArgs.join(', ')}):`,
        `    # Iterator helper: ${iteratorDefinition.def.id} [${iteratorDefinition.sourceLabel}]`,
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
            iteratorDefinitionsByLookupKey,
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
      `    # Iterator state init: ${iteratorDefinition.def.id} [${iteratorDefinition.sourceLabel}]`,
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

      if (isIteratorDefinition(roundDef)) {
        const nestedIteratorDefinition = iteratorDefinitionsByLookupKey.get(
          buildIteratorDefinitionLookupKey(roundDef.id),
        );
        if (!nestedIteratorDefinition) {
          throw new Error(`Python export could not resolve nested iterator definition helper for "${roundDef.id}".`);
        }
        initLines.push(
          `    state[${JSON.stringify(roundStateKey)}] = ${nestedIteratorDefinition.functionName}_init_state()`,
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
      `    # Iterator helper: ${iteratorDefinition.def.id} [${iteratorDefinition.sourceLabel}]`,
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
        const roundArgs = buildIteratorRoundCallArguments(
          roundDef,
          iteratorDefinition.def.id,
          previousRoundExpression,
          roundKeyExpression,
        );
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

      if (isIteratorDefinition(roundDef)) {
        const nestedIteratorDefinition = iteratorDefinitionsByLookupKey.get(
          buildIteratorDefinitionLookupKey(roundDef.id),
        );
        if (!nestedIteratorDefinition) {
          throw new Error(`Python export could not resolve nested iterator definition helper for "${roundDef.id}".`);
        }
        const roundArgs = buildIteratorRoundCallArguments(
          roundDef,
          iteratorDefinition.def.id,
          previousRoundExpression,
          roundKeyExpression,
        );
        tickLines.push(
          `    # Round ${roundNumber}: ${iteratorDefinition.def.roundDefId}`,
          `    ${roundVariableName} = ${nestedIteratorDefinition.functionName}_tick(state[${JSON.stringify(roundStateKey)}], tick${roundArgs.length > 0 ? `, ${roundArgs.join(', ')}` : ''})`,
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

    if (isCompositeDefinition(roundDef) || isIteratorDefinition(roundDef)) {
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
  const iteratorDefinitionsByLookupKey = new Map(
    iteratorDefinitions.map((definition) => [definition.lookupKey, definition]),
  );
  const topLevelIteratorDefinitions = iteratorDefinitions.filter(
    (definition) => !definition.ownerCompositeDefId,
  );
  const nestedIteratorDefinitions = iteratorDefinitions.filter(
    (definition) => Boolean(definition.ownerCompositeDefId),
  );
  const helperBlocks = [
    ...buildIteratorHelperDefinitions(nestedIteratorDefinitions, compositeDefinitionsById),
    ...buildCompositeHelperDefinitions(compositeDefinitions, registry, iteratorDefinitionsByLookupKey),
    ...buildIteratorHelperDefinitions(topLevelIteratorDefinitions, compositeDefinitionsById),
  ];
  const hasStatefulModules = projectHasStatefulExportCandidate(project, registry);

  if (hasStatefulModules) {
    return generateStatefulPythonExport(
      project,
      registry,
      compositeDefinitionsById,
      iteratorDefinitionsByLookupKey,
      helperBlocks,
    );
  }

  const order = buildTopologicalOrder(project, registry);
  const instancesById = getModuleInstanceMap(project);
  const variablesByModuleId = buildPythonVariableMap(project);
  const connectionsByTarget = getInputConnectionMap(project);
  const sourceParamOverrides = buildPythonSourceParamOverrides(
    project,
    registry,
    'source_overrides',
  );
  const expressionContext = createPythonExpressionContext(
    connectionsByTarget,
    variablesByModuleId,
    new Map(),
    sourceParamOverrides,
  );
  const bodyLines: string[] = [
    'def _mcw_source_override(source_overrides, module_id, default_value):',
    '    if source_overrides is None:',
    '        return default_value',
    '    return source_overrides.get(module_id, default_value)',
    '',
    'def _mcw_run(source_overrides=None):',
    '    sink_outputs = []',
    '    terminal_output = "n/a"',
  ];

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
      bodyLines.push(...buildSinkCaptureLines(moduleInstance, def, expressionContext, '    ', 'terminal_output'));
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
      const iteratorDefinition = iteratorDefinitionsByLookupKey.get(moduleInstance.id);
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

  bodyLines.push(
    '    return sink_outputs, terminal_output',
    '',
    'def run(source_overrides=None):',
    '    sink_outputs, _ = _mcw_run(source_overrides)',
    '    return sink_outputs',
    '',
    'def _mcw_verification_output(source_overrides=None):',
    '    _, terminal_output = _mcw_run(source_overrides)',
    '    return terminal_output',
    '',
    'def main():',
    '    for module_id, value in run():',
    '        print(f"{module_id}: {value}")',
    '',
    'if __name__ == "__main__":',
    '    main()',
  );

  const helperPrefix = helperBlocks.length > 0 ? `${helperBlocks.join('\n\n')}\n\n` : '';

  return `${PYTHON_RUNTIME}\n\n${helperPrefix}${bodyLines.join('\n')}\n`;
}

export function generatePythonExportFiles(
  project: Project,
  registry: ModuleRegistry,
  workspaceName: string,
  parityCases: PythonExportParityCandidate[] = [],
): PythonExportFiles {
  const singleFileSource = generatePythonExport(project, registry);
  if (!singleFileSource.startsWith(PYTHON_RUNTIME)) {
    throw new Error('Python export runtime prelude was not found in the generated source.');
  }

  const workspaceBody = singleFileSource
    .slice(PYTHON_RUNTIME.length)
    .replace(/^\s*\n/, '');
  const hasStatefulModules = projectHasStatefulExportCandidate(project, registry);
  const embeddedParity = deriveEmbeddedPythonParity(project, registry, parityCases);

  return {
    runtimeFileName: getPythonRuntimeFileName(),
    runtimeSource: buildPythonRuntimeLibrarySource(),
    workspaceFileName: getPythonRuntimeSurfaceWorkspaceFileName(workspaceName),
    workspaceSource:
      buildPythonWorkspaceFileHeader(workspaceName, hasStatefulModules)
      + qualifyPythonRuntimeReferences(workspaceBody),
    parityFileName: getPythonParityFileName(),
    paritySource: buildPythonParityScript(
      workspaceName,
      getPythonRuntimeSurfaceWorkspaceFileName(workspaceName),
      embeddedParity.parityCases,
      embeddedParity.statusReason,
      embeddedParity.statusDetails,
    ),
  };
}

function generateStatefulPythonExport(
  project: Project,
  registry: ModuleRegistry,
  compositeDefinitionsById: Map<string, CompositeExportDefinition>,
  iteratorDefinitionsByLookupKey: Map<string, IteratorExportDefinition>,
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
  const sourceParamOverrides = buildPythonSourceParamOverrides(
    project,
    registry,
    'source_overrides',
  );
  const expressionContext = createPythonExpressionContext(
    connectionsByTarget,
    variablesByModuleId,
    new Map(),
    sourceParamOverrides,
  );
  const collectedOutputModuleId =
    order.find((moduleId) => {
      const moduleInstance = instancesById.get(moduleId);
      const def = moduleInstance ? registry[moduleInstance.defId] : null;
      return Boolean(def && (SYMBOL_SINK_DEF_IDS.has(def.id) || BIT_SINK_DEF_IDS.has(def.id) || HEX_SINK_DEF_IDS.has(def.id)));
    }) ?? null;
  const bodyLines: string[] = [
    'def _mcw_source_override(source_overrides, module_id, default_value):',
    '    if source_overrides is None:',
    '        return default_value',
    '    return source_overrides.get(module_id, default_value)',
    '',
    'def _mcw_run_ticks(tick_count_override=None, source_overrides=None):',
    `    tick_count = ${tickCount} if tick_count_override is None else tick_count_override`,
    '    if not isinstance(tick_count, int) or tick_count <= 0:',
    '        raise ValueError("Tick count must be a positive integer.")',
    '    sink_output_lines = []',
    '    collected_output_chars = []',
  ];

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
      const iteratorDefinition = iteratorDefinitionsByLookupKey.get(moduleInstance.id);
      if (!iteratorDefinition || !iteratorDefinition.stateful) {
        continue;
      }
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = ${iteratorDefinition.functionName}_init_state(${buildIteratorStateInitArguments(iteratorDefinition, expressionContext).join(', ')})`,
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

    if (def.id === 'TickedSymbolsToSequence') {
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = ticked_symbols_to_sequence_init(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'collected'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'count'))})`,
      );
      continue;
    }

    if (def.id === 'TickedBitsToSequence') {
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = ticked_bits_to_sequence_init(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'collected'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'count'))})`,
      );
      continue;
    }

    if (def.id === 'AsciiSequenceToTicked') {
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = ascii_sequence_to_ticked_init(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'index'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'wrap'))})`,
      );
      continue;
    }

    if (def.id === 'SymbolSequenceToTicked') {
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = symbol_sequence_to_ticked_init(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'index'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'wrap'))})`,
      );
      continue;
    }

    if (def.id === 'BitsSequenceToTicked') {
      const variableName = variablesByModuleId.get(moduleInstance.id);
      if (!variableName) {
        throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
      }
      bodyLines.push(
        buildGeneratedModuleComment(moduleInstance, def, '    ', 'State init'),
        `    ${variableName}_state = bits_sequence_to_ticked_init(${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'index'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'wordWidth'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'wrap'))}, ${toPythonLiteral(getResolvedParamValue(moduleInstance, def, 'remainderMode'))})`,
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

    const variableName = variablesByModuleId.get(moduleId);
    if (!variableName) {
      throw new Error(`Python export could not resolve a variable for "${moduleId}".`);
    }

    if (SYMBOL_SINK_DEF_IDS.has(def.id) || BIT_SINK_DEF_IDS.has(def.id) || HEX_SINK_DEF_IDS.has(def.id)) {
      const inputExpression = expressionContext.getInputExpression(moduleInstance.id, 'in');
      const sinkValueVariable = `${variableName}_sink_value`;
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        ', 'Sink'));
      if (SYMBOL_SINK_DEF_IDS.has(def.id)) {
        bodyLines.push(`        ${sinkValueVariable} = format_symbol_sink(${inputExpression})`);
      } else if (BIT_SINK_DEF_IDS.has(def.id)) {
        bodyLines.push(`        ${sinkValueVariable} = format_bit_sink(${inputExpression})`);
      } else {
        bodyLines.push(`        ${sinkValueVariable} = format_hex_sink(${inputExpression})`);
      }
      bodyLines.push(
        `        sink_output_lines.append(format_ticked_sink_line(tick, ${JSON.stringify(moduleInstance.id)}, ${sinkValueVariable}))`,
      );
      if (moduleInstance.id === collectedOutputModuleId) {
        bodyLines.push(`        collected_output_chars.append(${sinkValueVariable})`);
      }
      continue;
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
      const iteratorDefinition = iteratorDefinitionsByLookupKey.get(moduleInstance.id);
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

    if (def.id === 'BaudotSource') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = baudot_source_tick(${expressionContext.getParamExpression(moduleInstance, def, 'value')}, tick)`,
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

    if (def.id === 'TickedSymbolsToSequence') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = ticked_symbols_to_sequence_eval(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'clock')}, ${variableName}_state)`,
      );
      continue;
    }

    if (def.id === 'TickedBitsToSequence') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = ticked_bits_to_sequence_eval(${expressionContext.getInputExpression(moduleId, 'in')}, ${expressionContext.getInputExpression(moduleId, 'clock')}, ${variableName}_state)`,
      );
      continue;
    }

    if (def.id === 'AsciiSequenceToTicked') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = ascii_sequence_to_ticked_eval(${expressionContext.getInputExpression(moduleId, 'in')}, ${variableName}_state)`,
      );
      continue;
    }

    if (def.id === 'SymbolSequenceToTicked') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = symbol_sequence_to_ticked_eval(${expressionContext.getInputExpression(moduleId, 'in')}, ${variableName}_state)`,
      );
      continue;
    }

    if (def.id === 'BitsSequenceToTicked') {
      bodyLines.push(buildGeneratedModuleComment(moduleInstance, def, '        '));
      bodyLines.push(
        `        ${variableName} = bits_sequence_to_ticked_eval(${expressionContext.getInputExpression(moduleId, 'in')}, ${variableName}_state)`,
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
    if (!def || (def.id !== 'Counter' && def.id !== 'LFSR' && def.id !== 'Rotor' && def.id !== 'TickedSymbolsToSequence' && def.id !== 'TickedBitsToSequence' && def.id !== 'AsciiSequenceToTicked' && def.id !== 'SymbolSequenceToTicked' && def.id !== 'BitsSequenceToTicked')) {
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
    if (!def || (def.id !== 'Counter' && def.id !== 'LFSR' && def.id !== 'Rotor' && def.id !== 'TickedSymbolsToSequence' && def.id !== 'TickedBitsToSequence' && def.id !== 'AsciiSequenceToTicked' && def.id !== 'SymbolSequenceToTicked' && def.id !== 'BitsSequenceToTicked')) {
      continue;
    }

    const variableName = variablesByModuleId.get(moduleInstance.id);
    if (!variableName) {
      throw new Error(`Python export could not resolve a variable for "${moduleInstance.id}".`);
    }

    const stepFlagName = `step_${variableName}`;
    const advanceCall =
      def.id === 'Counter'
        ? `counter_advance(${variableName}_state)`
        : def.id === 'LFSR'
          ? `lfsr_advance(${variableName}_state)`
          : def.id === 'Rotor'
            ? `rotor_advance(${variableName}_state)`
            : def.id === 'TickedSymbolsToSequence'
              ? `ticked_symbols_to_sequence_advance(${expressionContext.getInputExpression(moduleInstance.id, 'in')}, ${expressionContext.getInputExpression(moduleInstance.id, 'clock')}, ${variableName}_state)`
              : def.id === 'TickedBitsToSequence'
                ? `ticked_bits_to_sequence_advance(${expressionContext.getInputExpression(moduleInstance.id, 'in')}, ${expressionContext.getInputExpression(moduleInstance.id, 'clock')}, ${variableName}_state)`
                : def.id === 'AsciiSequenceToTicked'
                  ? `ascii_sequence_to_ticked_advance(${variableName}_state)`
                  : def.id === 'BitsSequenceToTicked'
                    ? `bits_sequence_to_ticked_advance(${variableName}_state)`
                    : `symbol_sequence_to_ticked_advance(${variableName}_state)`;
    bodyLines.push(
      buildGeneratedModuleComment(moduleInstance, def, '        ', 'Advance'),
      `        if ${stepFlagName}:`,
      `            ${advanceCall}`,
    );
  }

  bodyLines.push(
    '',
    `    return sink_output_lines, ''.join(collected_output_chars) if collected_output_chars else 'n/a'`,
    '',
    'def run_ticks(tick_count_override=None, source_overrides=None):',
    '    sink_output_lines, _ = _mcw_run_ticks(tick_count_override, source_overrides)',
    '    return sink_output_lines',
    '',
    'def _mcw_ticked_verification_output(tick_count_override=None, source_overrides=None):',
    '    _, collected_output = _mcw_run_ticks(tick_count_override, source_overrides)',
    '    return collected_output',
    '',
    'def main():',
    '    for line in run_ticks():',
    '        print(line)',
    '',
    'if __name__ == "__main__":',
    '    main()',
  );

  const helperPrefix = helperBlocks.length > 0 ? `${helperBlocks.join('\n\n')}\n\n` : '';

  return `${PYTHON_RUNTIME}\n\n${helperPrefix}${bodyLines.join('\n')}\n`;
}
