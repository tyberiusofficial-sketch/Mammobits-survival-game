export async function submitScore(wallet, score, tsISO){
  console.log('submitScore (stub):', wallet, score, tsISO);
  return { ok:true };
}
export async function getTopScores(){ return [{wallet:'0xABC', score:1234, created_at:new Date().toISOString()}]; }
export async function getMyScores(){ return [{wallet:'you', score:900, created_at:new Date().toISOString()}]; }
