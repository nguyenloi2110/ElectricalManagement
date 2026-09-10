"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Gauge, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { GuardedDialogContent } from "@/components/guarded-dialog-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/form-label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { StationOption } from "@/app/(dashboard)/customers/CustomerListClient";

type MeterDto = {
  id: string;
  code: number;
  name: string;
  transformerStationId: string;
  transformerStationName?: string;
  startNum: number;
  endNum: number;
  description: string | null;
  isUpdated: boolean;
};

type PendingMeter = {
  key: string;
  name: string;
  transformerStationId: string;
  startNum: number;
  endNum: number;
  description: string;
};

interface CustomerFormModalProps {
  mode: "create" | "edit";
  customerId?: string;
  stations: StationOption[];
  onClose: () => void;
  onSaved: () => void;
}

const emptyMeterForm = (stations: StationOption[]) => ({
  name: "",
  transformerStationId: stations[0]?.id ?? "",
  startNum: "0",
  endNum: "0",
  description: "",
});

export function CustomerFormModal({ mode, customerId, stations, onClose, onSaved }: CustomerFormModalProps) {
  const [tab, setTab] = useState<"info" | "meters">("info");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [isHasZalo, setIsHasZalo] = useState(false);

  function updateName(v: string) {
    setName(v);
    setDirty(true);
  }
  function updatePhone(v: string) {
    setPhone(v);
    setDirty(true);
  }
  function updateDescription(v: string) {
    setDescription(v);
    setDirty(true);
  }
  function updateZalo(v: boolean) {
    setIsHasZalo(v);
    setDirty(true);
  }

  const [pendingMeters, setPendingMeters] = useState<PendingMeter[]>([]);
  const [existingMeters, setExistingMeters] = useState<MeterDto[]>([]);

  const [meterForm, setMeterForm] = useState(emptyMeterForm(stations));
  function updateMeterForm(v: ReturnType<typeof emptyMeterForm>) {
    setMeterForm(v);
    setDirty(true);
  }
  const [editingMeterId, setEditingMeterId] = useState<string | null>(null);
  const [meterError, setMeterError] = useState<string | null>(null);
  const [meterSaving, setMeterSaving] = useState(false);
  const [meterDeleteId, setMeterDeleteId] = useState<string | null>(null);
  const [meterDeleting, setMeterDeleting] = useState(false);
  const meterNameInputRef = useRef<HTMLInputElement>(null);
  function focusMeterNameInput() {
    meterNameInputRef.current?.focus();
  }

  useEffect(() => {
    if (mode !== "edit" || !customerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/customers/${customerId}`);
      const json = await res.json();
      if (!cancelled && json.success) {
        const c = json.data;
        setName(c.name);
        setPhone(c.phone);
        setDescription(c.description ?? "");
        setIsHasZalo(c.isHasZalo);
        setExistingMeters(c.meters ?? []);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, customerId]);

  function resetMeterForm() {
    setMeterForm(emptyMeterForm(stations));
    setEditingMeterId(null);
    setMeterError(null);
  }

  function validateMeterForm(): { startNum: number; endNum: number } | null {
    if (!meterForm.name.trim() || !meterForm.transformerStationId) {
      setMeterError("Vui lòng nhập tên đồng hồ và chọn trạm biến áp");
      return null;
    }
    const startNum = Number(meterForm.startNum);
    const endNum = Number(meterForm.endNum);
    if (!Number.isFinite(startNum) || !Number.isFinite(endNum) || endNum < startNum) {
      setMeterError("Số cuối phải lớn hơn hoặc bằng số đầu");
      return null;
    }
    return { startNum, endNum };
  }

  function addPendingMeter() {
    const validated = validateMeterForm();
    if (!validated) return;
    setPendingMeters((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random()}`,
        name: meterForm.name.trim(),
        transformerStationId: meterForm.transformerStationId,
        startNum: validated.startNum,
        endNum: validated.endNum,
        description: meterForm.description.trim(),
      },
    ]);
    resetMeterForm();
  }

  function removePendingMeter(key: string) {
    setPendingMeters((prev) => prev.filter((m) => m.key !== key));
  }

  function startEditMeter(m: MeterDto) {
    setEditingMeterId(m.id);
    setMeterError(null);
    setMeterForm({
      name: m.name,
      transformerStationId: m.transformerStationId,
      startNum: String(m.startNum),
      endNum: String(m.endNum),
      description: m.description ?? "",
    });
  }

  async function submitMeterForEdit() {
    if (!customerId) return;
    const validated = validateMeterForm();
    if (!validated) return;

    setMeterSaving(true);
    setMeterError(null);
    try {
      const body = {
        name: meterForm.name.trim(),
        transformerStationId: meterForm.transformerStationId,
        startNum: validated.startNum,
        endNum: validated.endNum,
        description: meterForm.description.trim() || null,
      };
      const url = editingMeterId
        ? `/api/customers/${customerId}/meters/${editingMeterId}`
        : `/api/customers/${customerId}/meters`;
      const res = await fetch(url, {
        method: editingMeterId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setMeterError(json.message ?? "Có lỗi xảy ra");
        return;
      }
      toast.success(editingMeterId ? "Đã cập nhật đồng hồ" : "Đã thêm đồng hồ");
      const refreshed = await fetch(`/api/customers/${customerId}`).then((r) => r.json());
      if (refreshed.success) setExistingMeters(refreshed.data.meters ?? []);
      resetMeterForm();
      setDirty(false);
    } finally {
      setMeterSaving(false);
    }
  }

  async function confirmDeleteMeter() {
    if (!meterDeleteId || !customerId) return;
    setMeterDeleting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/meters/${meterDeleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setExistingMeters((prev) => prev.filter((m) => m.id !== meterDeleteId));
        setMeterDeleteId(null);
        toast.success("Đã xóa đồng hồ");
      } else {
        toast.error(json.message ?? "Xóa đồng hồ thất bại");
      }
    } finally {
      setMeterDeleting(false);
    }
  }

  async function handleSubmitInfo() {
    if (!name.trim() || !phone.trim()) {
      setError("Vui lòng nhập tên khách hàng và điện thoại");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            description: description.trim() || null,
            isHasZalo,
            meters: pendingMeters.map((m) => ({
              name: m.name,
              transformerStationId: m.transformerStationId,
              startNum: m.startNum,
              endNum: m.endNum,
              description: m.description || null,
            })),
          }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(json.message ?? "Có lỗi xảy ra");
          return;
        }
        toast.success("Đã thêm khách hàng mới");
      } else {
        const res = await fetch(`/api/customers/${customerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            description: description.trim() || null,
            isHasZalo,
          }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(json.message ?? "Có lỗi xảy ra");
          return;
        }
        toast.success("Đã cập nhật thông tin khách hàng");
      }
      setDirty(false);
      onSaved();
    } catch {
      setError("Không thể kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <GuardedDialogContent dirty={dirty} className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{mode === "create" ? "Thêm khách hàng" : "Xem/Sửa khách hàng"}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "create" || tab === "info") handleSubmitInfo();
            }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {mode === "edit" ? (
              <Tabs value={tab} onValueChange={(v) => setTab(v as "info" | "meters")} className="flex flex-1 flex-col gap-0 overflow-hidden">
                <TabsList variant="line" className="mx-6 mt-2 w-fit">
                  <TabsTrigger value="info">Thông tin khách hàng</TabsTrigger>
                  <TabsTrigger value="meters">Danh sách đồng hồ điện</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <TabsContent value="info" className="mt-0">
                        <CustomerInfoFields
                          name={name}
                          phone={phone}
                          description={description}
                          isHasZalo={isHasZalo}
                          onNameChange={updateName}
                          onPhoneChange={updatePhone}
                          onDescriptionChange={updateDescription}
                          onZaloChange={updateZalo}
                          error={error}
                        />
                      </TabsContent>

                      <TabsContent value="meters" className="mt-0 space-y-5">
                        <MeterTable
                          meters={existingMeters}
                          onEdit={startEditMeter}
                          onDelete={setMeterDeleteId}
                          onAddNew={focusMeterNameInput}
                        />
                        <MeterFormCard
                          stations={stations}
                          value={meterForm}
                          onChange={updateMeterForm}
                          error={meterError}
                          saving={meterSaving}
                          onSubmit={submitMeterForEdit}
                          onCancelEdit={editingMeterId ? resetMeterForm : undefined}
                          isEditing={!!editingMeterId}
                          nameInputRef={meterNameInputRef}
                        />
                      </TabsContent>
                    </>
                  )}
                </div>
              </Tabs>
            ) : (
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <CustomerInfoFields
                  name={name}
                  phone={phone}
                  description={description}
                  isHasZalo={isHasZalo}
                  onNameChange={updateName}
                  onPhoneChange={updatePhone}
                  onDescriptionChange={updateDescription}
                  onZaloChange={updateZalo}
                  error={error}
                />

                <div className="space-y-5">
                  <PendingMeterTable
                    meters={pendingMeters}
                    stations={stations}
                    onRemove={removePendingMeter}
                    onAddNew={focusMeterNameInput}
                  />
                  <MeterFormCard
                    stations={stations}
                    value={meterForm}
                    onChange={updateMeterForm}
                    error={meterError}
                    onSubmit={addPendingMeter}
                    isEditing={false}
                    nameInputRef={meterNameInputRef}
                  />
                </div>
              </div>
            )}

            {(mode === "create" || tab === "info") && !loading && (
              <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Hủy
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu
                </Button>
              </DialogFooter>
            )}
          </form>
        </GuardedDialogContent>
      </Dialog>

      <ConfirmDialog
        open={meterDeleteId !== null}
        onOpenChange={(open) => !open && setMeterDeleteId(null)}
        title="Xóa đồng hồ"
        description="Bạn có chắc chắn muốn xóa đồng hồ này?"
        loading={meterDeleting}
        onConfirm={confirmDeleteMeter}
      />
    </>
  );
}

function CustomerInfoFields({
  name,
  phone,
  description,
  isHasZalo,
  onNameChange,
  onPhoneChange,
  onDescriptionChange,
  onZaloChange,
  error,
}: {
  name: string;
  phone: string;
  description: string;
  isHasZalo: boolean;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onZaloChange: (v: boolean) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <FormLabel required htmlFor="customer-name">Tên khách hàng</FormLabel>
          <Input
            id="customer-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nhập tên khách hàng"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <FormLabel required htmlFor="customer-phone">Điện thoại</FormLabel>
          <Input
            id="customer-phone"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="Nhập số điện thoại (vd: 0987xxxxxx)"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <FormLabel htmlFor="customer-description">Mô tả</FormLabel>
        <Textarea
          id="customer-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Nhập mô tả chi tiết (không bắt buộc)"
          rows={3}
        />
      </div>
      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <Switch checked={isHasZalo} onCheckedChange={onZaloChange} />
        Có zalo hay không?
      </label>
    </div>
  );
}

function MeterSectionHeading({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Gauge className="h-4 w-4 text-muted-foreground" />
      Danh sách đồng hồ đã đăng ký ({count})
    </div>
  );
}

function MeterTable({
  meters,
  onEdit,
  onDelete,
  onAddNew,
}: {
  meters: MeterDto[];
  onEdit: (m: MeterDto) => void;
  onDelete: (id: string) => void;
  onAddNew?: () => void;
}) {
  return (
    <div className="space-y-2">
      <MeterSectionHeading count={meters.length} />
      {meters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/40">
          <EmptyState
            icon={Gauge}
            title="Chưa có đồng hồ nào được kết nối"
            actionLabel={onAddNew ? "Thêm đồng hồ ngay" : undefined}
            onAction={onAddNew}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Tên</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Trạm biến áp</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Số đầu</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Số cuối</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Đã cập nhật chỉ số</TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meters.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                  <TableCell>{m.transformerStationName}</TableCell>
                  <TableCell>{m.startNum}</TableCell>
                  <TableCell>{m.endNum}</TableCell>
                  <TableCell>
                    <StatusBadge tone={m.isUpdated ? "success" : "warning"}>
                      {m.isUpdated ? "Đã cập nhật" : "Chưa cập nhật"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(m)}
                        className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDelete(m.id)}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function PendingMeterTable({
  meters,
  stations,
  onRemove,
  onAddNew,
}: {
  meters: PendingMeter[];
  stations: StationOption[];
  onRemove: (key: string) => void;
  onAddNew?: () => void;
}) {
  return (
    <div className="space-y-2">
      <MeterSectionHeading count={meters.length} />
      {meters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/40">
          <EmptyState
            icon={Gauge}
            title="Chưa có đồng hồ nào được kết nối"
            actionLabel={onAddNew ? "Thêm đồng hồ ngay" : undefined}
            onAction={onAddNew}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Tên</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Trạm biến áp</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Số đầu</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Số cuối</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {meters.map((m) => (
                <TableRow key={m.key} className="hover:bg-muted/40">
                  <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                  <TableCell>{stations.find((s) => s.id === m.transformerStationId)?.name}</TableCell>
                  <TableCell>{m.startNum}</TableCell>
                  <TableCell>{m.endNum}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemove(m.key)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function MeterFormCard({
  stations,
  value,
  onChange,
  error,
  saving,
  onSubmit,
  onCancelEdit,
  isEditing,
  nameInputRef,
}: {
  stations: StationOption[];
  value: ReturnType<typeof emptyMeterForm>;
  onChange: (value: ReturnType<typeof emptyMeterForm>) => void;
  error?: string | null;
  saving?: boolean;
  onSubmit: () => void;
  onCancelEdit?: () => void;
  isEditing: boolean;
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      className={`space-y-4 rounded-xl border p-4 ${
        isEditing
          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "border-border bg-muted/40"
      }`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
          e.preventDefault();
          if (!saving) onSubmit();
        }
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isEditing
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
          }`}
        >
          {isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </div>
        <h4 className="text-sm font-semibold text-foreground">
          {isEditing ? "Cập nhật thông tin đồng hồ" : "Thêm đồng hồ mới"}
        </h4>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <FormLabel required className="text-xs text-muted-foreground">Tên đồng hồ</FormLabel>
          <Input
            ref={nameInputRef}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Nhập tên đồng hồ"
            className="h-8 bg-card text-sm"
          />
        </div>
        <div className="space-y-1">
          <FormLabel required className="text-xs text-muted-foreground">Trạm biến áp</FormLabel>
          <Select
            value={value.transformerStationId}
            onValueChange={(v) => onChange({ ...value, transformerStationId: v })}
          >
            <SelectTrigger className="h-8 w-full bg-card text-sm">
              <SelectValue placeholder="Chọn trạm biến áp..." />
            </SelectTrigger>
            <SelectContent>
              {stations.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <FormLabel required className="text-xs text-muted-foreground">Số đầu</FormLabel>
          <Input
            type="number"
            value={value.startNum}
            onChange={(e) => onChange({ ...value, startNum: e.target.value })}
            placeholder="Nhập chỉ số đầu"
            className="h-8 bg-card text-sm"
          />
        </div>
        <div className="space-y-1">
          <FormLabel required className="text-xs text-muted-foreground">Số cuối</FormLabel>
          <Input
            type="number"
            value={value.endNum}
            onChange={(e) => onChange({ ...value, endNum: e.target.value })}
            placeholder="Nhập chỉ số cuối"
            className="h-8 bg-card text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <FormLabel className="text-xs text-muted-foreground">Mô tả</FormLabel>
          <Textarea
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="Nhập mô tả thêm (không bắt buộc)"
            rows={2}
            className="bg-card text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancelEdit && (
          <Button type="button" variant="outline" size="sm" onClick={onCancelEdit} className="text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Hủy
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={onSubmit}
          className={isEditing ? "bg-emerald-600 text-white hover:bg-emerald-700" : undefined}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isEditing ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {isEditing ? "Cập nhật" : "Thêm đồng hồ"}
        </Button>
      </div>
    </div>
  );
}
