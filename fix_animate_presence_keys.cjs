const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Find all `<AnimatePresence>` blocks
  const animatePresenceRegex = /<AnimatePresence[^>]*>([\s\S]*?)<\/AnimatePresence>/g;
  
  let newContent = content.replace(animatePresenceRegex, (match, inner) => {
    // Inside `inner`, look for conditional rendering like `{condition && (<div ...`
    // and if the tag inside doesn't have a key, add one based on a counter or the file name
    let innerChanged = false;
    
    // We'll just look for any tag immediately following `{condition && (` or `{condition ? (`
    const tagRegex = /\{([^}]+)&&\s*\(\s*<([a-zA-Z0-9_\.]+)(\s+)/g;
    
    let newInner = inner.replace(tagRegex, (match2, condition, tag, spaces) => {
      // Check if it already has a key
      // We just inject `key="ap-child-{random}"`
      if (spaces.includes('key=')) return match2;
      
      const randomKey = Math.random().toString(36).substring(7);
      innerChanged = true;
      return `{${condition}&& (\n<${tag} key="ap-modal-${randomKey}"${spaces}`;
    });
    
    // Also match self-closing tags `{condition && <Component ... />}`
    const tagRegex2 = /\{([^}]+)&&\s*<([a-zA-Z0-9_\.]+)(\s+)/g;
    newInner = newInner.replace(tagRegex2, (match2, condition, tag, spaces) => {
      if (spaces.includes('key=')) return match2;
      
      const randomKey = Math.random().toString(36).substring(7);
      innerChanged = true;
      return `{${condition}&& <${tag} key="ap-modal-${randomKey}"${spaces}`;
    });

    if (innerChanged) {
      changed = true;
      return `<AnimatePresence>${newInner}</AnimatePresence>`; // Simplified, assumes no props on AnimatePresence besides mode="wait"
    }
    return match;
  });
  
  // We should also replace the original AnimatePresence tag properly, the above regex drops its props
  // Let's do it better
  if (changed) {
    // Re-do with better regex
  }
}

// Just do it manually with sed or similar for the files.
