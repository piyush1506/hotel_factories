'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getStatusMeta, ROLE_LABELS } from '../../utils/helpers';
import {
  Avatar,
  Badge,
  ConfirmDialog,
  Drawer,
  EmptyState,
  GhostButton,
  PageHeader,
  Panel,
  PanelHeader,
  SearchField,
  SegmentedTabs,
  SelectInput,
  TableShell
} from './AdminUI';
import {
  downloadCsv,
  formatCurrency,
  formatDate,
  formatShortDate,
  percent,
  userDisplayBookings
} from './adminUtils';

const ROLE_TONES = {
  customer: 'sky',
  hotel_owner: 'violet',
  admin: 'amber'
};

export default function AdminUsers({ users = [], bookings = [], currentUser, onUpdateRole, focusRequest }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [roleChange, setRoleChange] = useState(null);
  const [roleBusy, setRoleBusy] = useState(false);
  const handledFocus = useRef(null);

  const selected = users.find((account) => account.id === selectedId) || null;

  useEffect(() => {
    if (!focusRequest || focusRequest.type !== 'user' || handledFocus.current === focusRequest.nonce) return undefined;
    const frame = window.requestAnimationFrame(() => {
      handledFocus.current = focusRequest.nonce;
      if (users.some((account) => account.id === focusRequest.id)) {
        setSelectedId(focusRequest.id);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest, users]);

  const counts = useMemo(
    () => ({
      all: users.length,
      customer: users.filter((account) => account.role === 'customer').length,
      hotel_owner: users.filter((account) => account.role === 'hotel_owner').length,
      admin: users.filter((account) => account.role === 'admin').length
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users
      .filter((account) => {
        const matchesQuery =
          !query ||
          [account.name, account.email, account.phone, account.id]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        const matchesRole = roleFilter === 'all' || account.role === roleFilter;
        return matchesQuery && matchesRole;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [users, search, roleFilter]);

  const confirmRole = async () => {
    if (!roleChange) return;
    setRoleBusy(true);
    try {
      const ok = await onUpdateRole(roleChange.user, roleChange.role);
      if (ok) setRoleChange(null);
    } finally {
      setRoleBusy(false);
    }
  };

  const exportUsers = () => {
    downloadCsv(
      `hotel-factories-users-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Role', key: 'role' },
        { label: 'Joined', key: 'createdAt' },
        { label: 'Bookings', value: (row) => userDisplayBookings(row, bookings).length },
        { label: 'Lifetime value', value: (row) => userDisplayBookings(row, bookings).reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0) }
      ],
      filtered
    );
  };

  const selectedBookings = selected ? userDisplayBookings(selected, bookings) : [];
  const selectedSpend = selectedBookings.reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0);

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="Operations"
        title="Guests & users"
        description="Search the customer base, review travel activity, and manage platform access roles with an audited workflow."
        actions={<GhostButton icon="fa-file-arrow-down" onClick={exportUsers}>Export CSV</GhostButton>}
        meta={<Badge tone="violet">{users.length} accounts</Badge>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <UserStat label="All accounts" value={counts.all} icon="fa-users" tone="sky" />
        <UserStat label="Travellers" value={counts.customer} icon="fa-suitcase-rolling" tone="sky" hint={`${percent(counts.customer, counts.all)}% of base`} />
        <UserStat label="Hotel partners" value={counts.hotel_owner} icon="fa-hotel" tone="violet" />
        <UserStat label="Administrators" value={counts.admin} icon="fa-user-shield" tone="amber" />
      </div>

      <Panel>
        <PanelHeader
          title="Platform directory"
          subtitle={`${filtered.length} of ${users.length} accounts`}
          icon="fa-address-book"
          action={<SearchField value={search} onChange={setSearch} placeholder="Search name, email or phone" className="w-full sm:w-72" />}
        />
        <div className="px-5 pb-3 sm:px-6">
          <SegmentedTabs
            value={roleFilter}
            onChange={setRoleFilter}
            tabs={[
              { value: 'all', label: 'All users', count: counts.all },
              { value: 'customer', label: 'Travellers', count: counts.customer },
              { value: 'hotel_owner', label: 'Hotel partners', count: counts.hotel_owner },
              { value: 'admin', label: 'Admins', count: counts.admin }
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 pb-6 sm:px-6">
            <EmptyState icon="fa-user-magnifying-glass" title="No users found" description="Try a different name, email address or role filter." />
          </div>
        ) : (
          <TableShell>
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 sm:px-6 whitespace-nowrap">User</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3 whitespace-nowrap">Joined</th>
                  <th className="px-3 py-3 whitespace-nowrap">Travel activity</th>
                  <th className="px-3 py-3 whitespace-nowrap">Role</th>
                  <th className="px-5 py-3 text-right sm:px-6 whitespace-nowrap">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((account) => {
                  const accountBookings = userDisplayBookings(account, bookings);
                  const spend = accountBookings.reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0);
                  const isSelf = account.id === currentUser?.id;
                  return (
                    <tr key={account.id} onClick={() => setSelectedId(account.id)} className="group cursor-pointer transition hover:bg-slate-50">
                      <td className="px-5 py-3.5 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={account.name} src={account.avatar} size="sm" />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
                              {account.name}
                              {isSelf && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">YOU</span>}
                            </p>
                            <p className="truncate font-mono text-xs text-slate-500">{account.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="block max-w-[200px] truncate text-sm font-semibold text-slate-700">{account.email}</span>
                        <span className="block text-xs text-slate-500">{account.phone || 'No phone'}</span>
                      </td>
                      <td className="px-3 py-3.5 text-xs font-semibold text-slate-600 whitespace-nowrap">{formatDate(account.createdAt)}</td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="block text-xs font-bold uppercase text-slate-400">Trips</span>
                            <span className="text-sm font-bold text-slate-800">{accountBookings.length}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-bold uppercase text-slate-400">Spend</span>
                            <span className="text-sm font-bold text-slate-900">{formatCurrency(spend, true)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                        <SelectInput
                          value={account.role}
                          disabled={isSelf}
                          onChange={(event) => {
                            if (event.target.value !== account.role) setRoleChange({ user: account, role: event.target.value });
                          }}
                          aria-label={`Role for ${account.name}`}
                          className="h-8 min-w-[136px] text-xs font-medium"
                        >
                          <option value="customer">Traveller</option>
                          <option value="hotel_owner">Hotel partner</option>
                          <option value="admin">Administrator</option>
                        </SelectInput>
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedId(account.id)}
                          aria-label={`View ${account.name}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableShell>
        )}
      </Panel>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.name || 'User profile'}
        subtitle={selected ? `${ROLE_LABELS[selected.role] || selected.role} · ${selected.email}` : ''}
        width="max-w-xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
              <Avatar name={selected.name} src={selected.avatar} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-heading text-lg font-semibold text-slate-900">{selected.name}</h3>
                <p className="truncate text-xs font-medium text-slate-600">{selected.email}</p>
                <p className="mt-0.5 text-xs text-slate-500">{selected.phone || 'No phone on file'}</p>
              </div>
              <Badge tone={ROLE_TONES[selected.role] || 'slate'}>{ROLE_LABELS[selected.role] || selected.role}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <ProfileStat label="Bookings" value={selectedBookings.length} icon="fa-calendar-check" />
              <ProfileStat label="Lifetime value" value={formatCurrency(selectedSpend, true)} icon="fa-indian-rupee-sign" />
              <ProfileStat label="Joined" value={formatDate(selected.createdAt, { month: 'short', year: 'numeric' })} icon="fa-calendar-plus" />
            </div>

            <Panel className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Account details</h3>
              <div className="space-y-0.5">
                <ProfileLine label="User ID" value={<span className="font-mono text-xs">{selected.id}</span>} />
                <ProfileLine label="Role" value={ROLE_LABELS[selected.role] || selected.role} />
                <ProfileLine label="Email" value={selected.email} />
                <ProfileLine label="Phone" value={selected.phone || '—'} />
                <ProfileLine label="Account created" value={formatDate(selected.createdAt)} />
              </div>
            </Panel>

            <Panel className="p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Travel activity</h3>
              {selectedBookings.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-5 text-center text-xs text-slate-400">No bookings recorded for this account.</p>
              ) : (
                <div className="space-y-2">
                  {selectedBookings
                    .sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0))
                    .slice(0, 5)
                    .map((booking) => {
                      const meta = getStatusMeta(booking.status);
                      return (
                        <div key={booking.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-800">{booking.hotelName}</p>
                            <p className="text-xs text-slate-400">{formatShortDate(booking.checkInDate)} → {formatShortDate(booking.checkOutDate)} · {booking.roomName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-900">{formatCurrency(booking.totalAmount)}</p>
                            <span className={`text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Panel>

            <Panel className="p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Access role</h3>
              <p className="mb-3 text-xs leading-relaxed text-slate-400">
                Roles control which parts of the platform this account can access. Changes are applied immediately.
              </p>
              <SelectInput
                value={selected.role}
                disabled={selected.id === currentUser?.id}
                onChange={(event) => {
                  if (event.target.value !== selected.role) setRoleChange({ user: selected, role: event.target.value });
                }}
              >
                <option value="customer">Traveller — book stays only</option>
                <option value="hotel_owner">Hotel partner — manage own properties</option>
                <option value="admin">Administrator — full platform access</option>
              </SelectInput>
              {selected.id === currentUser?.id && (
                <p className="mt-2 text-xs font-semibold text-amber-600">You cannot change your own administrator role.</p>
              )}
            </Panel>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(roleChange)}
        onClose={() => setRoleChange(null)}
        onConfirm={confirmRole}
        title="Change access role?"
        message={
          roleChange
            ? `${roleChange.user.name} will be changed from ${ROLE_LABELS[roleChange.user.role] || roleChange.user.role} to ${ROLE_LABELS[roleChange.role] || roleChange.role}. ${roleChange.role === 'admin' ? 'Administrators have full control of the platform, including payouts and user roles.' : 'This will take effect immediately.'}`
            : ''
        }
        confirmLabel="Update role"
        busy={roleBusy}
        tone="slate"
      />
    </div>
  );
}

function UserStat({ label, value, icon, hint }) {
  return (
    <Panel className="flex items-center gap-3 p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200">
        <i className={`fa-solid ${icon} text-xs`} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="font-heading text-lg font-semibold leading-tight text-slate-900">{value}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </Panel>
  );
}

function ProfileStat({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <i className={`fa-solid ${icon} text-xs text-blue-500`} aria-hidden="true" />
      <p className="mt-1.5 truncate font-heading text-sm font-semibold leading-tight text-slate-900">{value}</p>
      <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function ProfileLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-1.5 last:border-0">
      <span className="shrink-0 text-xs text-slate-400">{label}</span>
      <span className="text-right text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
