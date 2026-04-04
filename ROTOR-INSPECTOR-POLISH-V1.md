# ROTOR-INSPECTOR-POLISH-V1

## Goal

Bring rotor wiring authoring closer to the improved permutation interaction model without changing rotor semantics.

## Shipped Shape

- Rotor wiring remains a visual first editor.
- Wiring supports:
  - drag an input letter onto an output letter
  - click an input to arm it, then click an output to route it there
- The active input and hovered output are surfaced in the editor meta chips.
- Output targets show clearer drop-target highlighting while editing.

## Boundaries

- No change to rotor execution semantics.
- Position, ring offset, and notch behavior remain separate authored parameters.
- No additional helper model or hidden machine abstraction was introduced.

## Notes

- This is a bounded interaction pass only.
- Reflector and plugboard were reviewed after rotor and left structurally unchanged because they were already in materially better shape.
