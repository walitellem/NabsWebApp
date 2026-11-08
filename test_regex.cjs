const str = `{datePreset === 'custom' && (<motion.div key="ap-motion-div-laz8up"
                initial={{ opacity: 0, height: 0 }}`;

const matches1 = [...str.matchAll(/\{([^}]+)&&\s*\(\s*<([A-Za-z0-9_\.]+)(\s+)/g)];
for (const m of matches1) {
    console.log(JSON.stringify(m[3]));
}
