'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowRightLeft } from 'lucide-react';

interface StudentTransferProps {
  studentId: string;
  currentCampuses: {
    campusId: string;
    isPrimary: boolean;
  }[];
}

export const StudentTransfer = ({ studentId, currentCampuses }: StudentTransferProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetCampusId, setTargetCampusId] = useState<string>('');
  const [keepOriginalCampus, setKeepOriginalCampus] = useState(false);
  const { toast } = useToast();

  const { data: campuses } = api.campus.getAll.useQuery();
  const utils = api.useContext();

  const transferMutation = api.student.transferCampus.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student transferred successfully',
      });
      utils.student.getOne.invalidate({ id: studentId });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleTransfer = async () => {
    if (!targetCampusId) return;

    try {
      await transferMutation.mutateAsync({
        studentId,
        targetCampusId,
        keepOriginalCampus,
      });
    } catch (error) {
      // Error is handled by the mutation error handler
    }
  };

  const availableCampuses = campuses?.filter(
    (campus) => !currentCampuses.some((cc) => cc.campusId === campus.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Student</DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>
              Select a target campus to transfer this student to.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Campus</Label>
              <Select
                value={targetCampusId}
                onValueChange={setTargetCampusId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target campus" />
                </SelectTrigger>
                <SelectContent>
                  {availableCampuses?.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={keepOriginalCampus}
                onCheckedChange={setKeepOriginalCampus}
              />
              <Label>Keep enrollment in current campus(es)</Label>
            </div>

            <Button
              onClick={handleTransfer}
              disabled={!targetCampusId}
              className="w-full"
            >
              Transfer Student
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}; 