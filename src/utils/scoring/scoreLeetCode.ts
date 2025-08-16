// utils/scoring.ts
export function scoreLocally(text: string, code: string) {
  const Completeness = Math.min(5, Math.ceil((text.length + code.length) / 400));
  const Correctness  = /function|const|let|=>|\)|\(/.test(code) ? 3 : 1;
  const Clarity      = Math.min(5, (text.match(/\./g)?.length ?? 0) + 1);
  const Impact       = /perf|optimi|refactor|security|a11y/i.test(text) ? 4 : 2;
  const Velocity     = Math.min(5, 1 + Math.floor((text.split('\n').length) / 8));
  const sum = Completeness + Correctness + Clarity + Impact + Velocity;
  return Math.round((sum / 25) * 100);
}
