export function getAvatarURL(avatar?: string): string {
	return avatar ? `/avatars/${avatar}` : '/avatars/default.png';
}
