import nextVitals from 'eslint-config-next/core-web-vitals';

// Async data loading callbacks update React state after their requests resolve.
const config = [...nextVitals, { rules: { 'react-hooks/set-state-in-effect': 'off' } }];
export default config;
