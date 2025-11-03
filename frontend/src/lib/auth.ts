export function loginWithTikTok(){window.location.href=`${import.meta.env.VITE_API_BASE}/auth/tiktok/login`}
export async function logout(){await fetch(`${import.meta.env.VITE_API_BASE}/auth/tiktok/logout`,{credentials:"include"});location.reload()}
