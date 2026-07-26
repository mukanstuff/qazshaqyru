'use client';

import { useState, useCallback } from 'react';
import type { EditorGuestInfo } from './types';

interface UseGuestHandlersOptions {
  guestNames: string[];
  guests: EditorGuestInfo[];
  onAddGuests: (
    guests: Array<{
      name: string;
      phone?: string;
      side?: 'bride' | 'groom';
      hasPlusOne?: boolean;
      householdLabel?: string;
    }>,
  ) => Promise<{ created: number }>;
  onDeleteGuest?: (guestId: string) => Promise<void>;
  onUpdateGuest?: (guest: {
    id: string;
    name: string;
    phone?: string | null;
    hasPlusOne?: boolean;
    householdLabel?: string | null;
  }) => Promise<void>;
}

export function useGuestHandlers({
  guestNames,
  guests,
  onAddGuests,
  onDeleteGuest,
  onUpdateGuest,
}: UseGuestHandlersOptions) {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestHasPlusOne, setGuestHasPlusOne] = useState(false);
  const [guestSide, setGuestSide] = useState<'bride' | 'groom' | ''>('');
  const [guestHousehold, setGuestHousehold] = useState('');
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestPhone, setEditGuestPhone] = useState('');
  const [editGuestHasPlusOne, setEditGuestHasPlusOne] = useState(false);
  const [editGuestHousehold, setEditGuestHousehold] = useState('');
  const [savingGuestEdit, setSavingGuestEdit] = useState(false);
  const [showBulkGuests, setShowBulkGuests] = useState(false);
  const [bulkGuestText, setBulkGuestText] = useState('');
  const [addingGuests, setAddingGuests] = useState(false);
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null);

  const displayGuests: EditorGuestInfo[] =
    guests.length > 0 ? guests : guestNames.map((name) => ({ name }));

  const attendingCount = displayGuests.filter(
    (g) =>
      g.responseStatus === 'attending' ||
      g.responseStatus === 'attending_plus_one' ||
      g.responseStatus === 'attending_no_children',
  ).length;

  const handleAddGuest = useCallback(async () => {
    const name = guestName.trim();
    if (!name) return;
    setAddingGuests(true);
    try {
      await onAddGuests([
        {
          name,
          phone: guestPhone.trim() || undefined,
          side: guestSide || undefined,
          hasPlusOne: guestHasPlusOne,
          householdLabel: guestHousehold.trim() || undefined,
        },
      ]);
      setGuestName('');
      setGuestPhone('');
      setGuestHasPlusOne(false);
      setGuestSide('');
      setGuestHousehold('');
    } finally {
      setAddingGuests(false);
    }
  }, [guestName, guestPhone, guestHasPlusOne, guestSide, guestHousehold, onAddGuests]);

  const handleBulkAddGuests = useCallback(async () => {
    const names = bulkGuestText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setAddingGuests(true);
    try {
      await onAddGuests(
        names.map((name) => ({
          name,
          side: guestSide || undefined,
        })),
      );
      setBulkGuestText('');
      setShowBulkGuests(false);
    } finally {
      setAddingGuests(false);
    }
  }, [bulkGuestText, guestSide, onAddGuests]);

  const handleDeleteGuest = useCallback(
    async (guestId: string) => {
      if (!onDeleteGuest) return;
      setDeletingGuestId(guestId);
      try {
        await onDeleteGuest(guestId);
      } finally {
        setDeletingGuestId(null);
      }
    },
    [onDeleteGuest],
  );

  const startEditGuest = useCallback((g: EditorGuestInfo) => {
    if (!g.id) return;
    setEditingGuestId(g.id);
    setEditGuestName(g.name);
    setEditGuestPhone(g.phone ?? '');
    setEditGuestHasPlusOne(g.hasPlusOne ?? false);
    setEditGuestHousehold(g.householdLabel ?? '');
  }, []);

  const handleSaveGuestEdit = useCallback(async () => {
    if (!onUpdateGuest || !editingGuestId) return;
    const name = editGuestName.trim();
    if (!name) return;
    setSavingGuestEdit(true);
    try {
      await onUpdateGuest({
        id: editingGuestId,
        name,
        phone: editGuestPhone.trim() || null,
        hasPlusOne: editGuestHasPlusOne,
        householdLabel: editGuestHousehold.trim() || null,
      });
      setEditingGuestId(null);
    } finally {
      setSavingGuestEdit(false);
    }
  }, [
    onUpdateGuest,
    editingGuestId,
    editGuestName,
    editGuestPhone,
    editGuestHasPlusOne,
    editGuestHousehold,
  ]);

  const cancelEditGuest = useCallback(() => {
    setEditingGuestId(null);
  }, []);

  const toggleBulkGuests = useCallback(() => {
    setShowBulkGuests((v) => !v);
  }, []);

  return {
    displayGuests,
    attendingCount,
    guestName,
    guestPhone,
    guestHasPlusOne,
    guestSide,
    guestHousehold,
    editingGuestId,
    editGuestName,
    editGuestPhone,
    editGuestHasPlusOne,
    editGuestHousehold,
    savingGuestEdit,
    showBulkGuests,
    bulkGuestText,
    addingGuests,
    deletingGuestId,
    setGuestName,
    setGuestPhone,
    setGuestHasPlusOne,
    setGuestSide,
    setGuestHousehold,
    setEditGuestName,
    setEditGuestPhone,
    setEditGuestHasPlusOne,
    setEditGuestHousehold,
    setBulkGuestText,
    handleAddGuest,
    handleBulkAddGuests,
    handleDeleteGuest,
    startEditGuest,
    handleSaveGuestEdit,
    cancelEditGuest,
    toggleBulkGuests,
  };
}
