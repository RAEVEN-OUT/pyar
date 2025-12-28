// src/components/chat/EditMessageDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { type Message } from '@/app/(protected)/chat/page';

interface EditMessageDialogProps {
  message: Message | null;
  onClose: () => void;
  onSave: (text: string) => void;
}

export function EditMessageDialog({ message, onClose, onSave }: EditMessageDialogProps) {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (message) {
      setEditedText(message.text || '');
    }
  }, [message]);

  const handleSave = () => {
    onSave(editedText);
    onClose();
  };

  return (
    <Dialog open={!!message} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={4}
          className="my-4"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}