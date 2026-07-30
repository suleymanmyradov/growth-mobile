/**
 * Test stub for lucide-react-native.
 *
 * The real package ships ESM .mjs that jest-expo's transform regex doesn't
 * match. Tests don't assert on icon glyphs, so every named icon is a no-op
 * component that renders its children (if any) inside a plain View.
 */
const React = require('react');
const { View } = require('react-native');

const StubIcon = React.forwardRef(function StubIcon(props, ref) {
  return React.createElement(View, { ...props, ref, testID: props.testID ?? 'lucide-icon' });
});

module.exports = new Proxy(
  { default: StubIcon },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      return StubIcon;
    },
  },
);
