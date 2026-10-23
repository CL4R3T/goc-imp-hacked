module.exports = function () {
  return {visitor: {Program(path, state) {
    for (const [before, after] of Object.entries(state.opts.names)) path.scope.rename(before, after);
  }}};
};
