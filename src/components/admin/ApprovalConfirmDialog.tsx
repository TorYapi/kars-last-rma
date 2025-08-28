
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';

interface ApprovalConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ApprovalConfirmDialog = ({ isOpen, onClose, onConfirm }: ApprovalConfirmDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sipariş Onayı</DialogTitle>
        </DialogHeader>
        <p className="mb-4">
          Bu siparişi onaylamak istediğinizden emin misiniz?
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button variant="default" onClick={onConfirm}>
            Onayla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalConfirmDialog;
