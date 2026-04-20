"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePipelineStore } from "@/lib/store";
import { Plus } from "lucide-react";

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [salesRep, setSalesRep] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const addClient = usePipelineStore((s) => s.addClient);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addClient({
      name,
      email,
      phone: phone || undefined,
      notes: notes || undefined,
      sales_rep: salesRep || undefined,
    });

    setName("");
    setSalesRep("");
    setEmail("");
    setPhone("");
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            新規相談申し込み
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>個別相談申し込み登録</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="name">ご本人様の名前 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              required
            />
          </div>
          <div>
            <Label htmlFor="salesRep">営業担当者</Label>
            <Input
              id="salesRep"
              value={salesRep}
              onChange={(e) => setSalesRep(e.target.value)}
              placeholder="担当者名"
            />
          </div>
          <div>
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yamada@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="090-1234-5678"
            />
          </div>
          <div>
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="相談内容のメモなど..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full">
            登録する
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
