import type { PersonView } from '@giapha/shared';
import { initials } from '../format';

export function Avatar({ person, size = 40 }: { person: PersonView | undefined; size?: number }) {
  const gender = person?.gender ?? 'unknown';
  const dead = person ? !person.isLiving : false;
  return (
    <span
      className={`avatar avatar-${gender}${dead ? ' avatar-dead' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {person?.photo ? <img src={person.photo} alt="" /> : initials(person?.fullName ?? '?')}
    </span>
  );
}
