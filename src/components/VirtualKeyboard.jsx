import React, { useRef, useState, useMemo } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

/**
 * VirtualKeyboard — pure "button grid" wrapper around react-simple-keyboard.
 *
 * We intentionally do NOT use react-simple-keyboard's internal input tracking
 * (no inputName / inputs / onChange props on the Keyboard widget).
 * Every key press is handled manually in handleKeyPress, computing the new
 * value from inputs[inputName] — the parent's single source of truth.
 *
 * This eliminates the internal-state-divergence bug that caused backspace to
 * appear broken: the library kept its own buffer that diverged from the parent
 * after each re-render. Now there is only one buffer — the parent's state.
 */
const VirtualKeyboard = ({ inputName, inputs, onChange, onClose }) => {
  const keyboard = useRef();
  const [layoutName, setLayoutName] = useState('default');

  // Keep a ref to the latest inputs so handleKeyPress always reads fresh values,
  // even when keys are pressed faster than React can re-render (rapid backspace, etc.)
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;        // update on every render — always current

  const inputNameRef = useRef(inputName);
  inputNameRef.current = inputName;  // same for inputName

  const isNumericInput = useMemo(() => {
    const numericFields = ['age', 'phone', 'otp', 'pin', 'zip', 'zipcode', 'verificationCode', 'verificationCodeInput'];
    return numericFields.some(field =>
      inputName?.toLowerCase().includes(field.toLowerCase())
    );
  }, [inputName]);

  // ─── All key-press logic — no internal KB state is used ──────────────────
  const handleKeyPress = (button) => {
    if (button === '{shift}' || button === '{lock}') {
      setLayoutName((prev) => (prev === 'default' ? 'shift' : 'default'));
      return;
    }
    if (button === '{close}') {
      onClose();
      return;
    }
    if (button === '{enter}' || button === '{tab}') return;

    // Use refs — always the freshest value even during rapid keypresses
    const activeInput = inputNameRef.current;
    const current = inputsRef.current?.[activeInput] ?? '';

    let next;
    if (button === '{bksp}') {
      next = current.slice(0, -1);
    } else if (button === '{space}') {
      next = current + ' ';
    } else {
      if (layoutName === 'shift') setLayoutName('default'); // auto-revert after uppercase
      next = current + button;
    }

    onChange(activeInput, next);
  };

  // ─── Layouts ──────────────────────────────────────────────────────────────
  const numericLayout = {
    default: [
      '1 2 3',
      '4 5 6',
      '7 8 9',
      '{bksp} 0 {enter}',
      '{close}',
    ],
  };

  const fullLayout = {
    default: [
      '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
      '{tab} q w e r t y u i o p [ ] \\',
      "{lock} a s d f g h j k l ; ' {enter}",
      '{shift} z x c v b n m , . / {shift}',
      '.com @ {space} {close}',
    ],
    shift: [
      '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
      '{tab} Q W E R T Y U I O P { } |',
      '{lock} A S D F G H J K L : " {enter}',
      '{shift} Z X C V B N M < > ? {shift}',
      '.com @ {space} {close}',
    ],
  };

  const numericDisplay = {
    '{close}': '✓ Done',
    '{bksp}': '⌫',
    '{enter}': '↵',
  };

  const fullDisplay = {
    '{close}': 'Hide Keyboard',
    '{bksp}': '⌫ Backspace',
    '{enter}': '↵ Enter',
    '{shift}': '⇧ Shift',
    '{lock}': 'Caps',
    '{tab}': 'Tab',
    '{space}': ' ',
  };

  return (
    <div className={`virtual-keyboard ${isNumericInput ? 'numeric-keyboard' : ''}`}>
      <Keyboard
        keyboardRef={(r) => (keyboard.current = r)}
        layoutName={isNumericInput ? 'default' : layoutName}
        onKeyPress={handleKeyPress}
        layout={isNumericInput ? numericLayout : fullLayout}
        display={isNumericInput ? numericDisplay : fullDisplay}
        theme={isNumericInput ? 'hg-theme-default numeric-theme' : 'hg-theme-default'}
        /* Intentionally omitted: inputName, inputs, onChange
           Keyboard is a pure button grid; all state lives in the parent. */
      />
    </div>
  );
};

export default VirtualKeyboard;