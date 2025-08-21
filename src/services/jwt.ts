export type DecodedJwt = { [k: string]: any } & { sub?: string };

function base64UrlDecode(input: string): string {
	// base64url -> base64
	let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
	const pad = b64.length % 4;
	if (pad === 2) b64 += '==';
	else if (pad === 3) b64 += '=';
	else if (pad !== 0) throw new Error('Invalid base64url string');
	if (typeof atob === 'function') {
		return decodeURIComponent(
			Array.prototype.map
				.call(atob(b64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
				.join('')
		);
	}
	// React Native: use Buffer
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const Buffer = require('buffer').Buffer;
	return Buffer.from(b64, 'base64').toString('utf8');
}

export function decodeJwt(token: string): DecodedJwt | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const payload = JSON.parse(base64UrlDecode(parts[1]));
		return payload as DecodedJwt;
	} catch {
		return null;
	}
}

export function getSubjectFromToken(token: string | null | undefined): string | null {
	if (!token) return null;
	const decoded = decodeJwt(token);
	return decoded?.sub ?? null;
} 