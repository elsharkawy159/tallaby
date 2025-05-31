"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface NewCampaignModalProps {
  children: React.ReactNode;
}

export const NewCampaignModal = ({ children }: NewCampaignModalProps) => {
  const t  = useTranslations();
  const [open, setOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [targetAudience, setTargetAudience] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignName || !campaignType || !budget || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    // Simulate campaign creation
    const campaignData = {
      name: campaignName,
      type: campaignType,
      budget: parseFloat(budget),
      startDate,
      endDate,
      targetAudience,
      status: "scheduled",
    };

    console.log("Creating campaign:", campaignData);

    toast({
      title: "Campaign created successfully!",
    });

    // Reset form
    setCampaignName("");
    setCampaignType("");
    setBudget("");
    setStartDate(undefined);
    setEndDate(undefined);
    setTargetAudience("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("marketing.createNewCampaign")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaignName">
              {t("marketing.campaignName")} *
            </Label>
            <Input
              id="campaignName"
              placeholder={t("marketing.enterCampaignName")}
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignType">
              {t("marketing.campaignType")} *
            </Label>
            <Select
              value={campaignType}
              onValueChange={setCampaignType}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t("marketing.selectCampaignType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">
                  {t("marketing.discount")}
                </SelectItem>
                <SelectItem value="promotion">
                  {t("marketing.promotion")}
                </SelectItem>
                <SelectItem value="bundle">{t("marketing.bundle")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">{t("marketing.budget")} *</Label>
            <Input
              id="budget"
              type="number"
              placeholder={t("marketing.enterBudget")}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("marketing.startDate")} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, "PPP")
                      : t("marketing.selectStartDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t("marketing.endDate")} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate
                      ? format(endDate, "PPP")
                      : t("marketing.selectEndDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">
              {t("marketing.targetAudience")}
            </Label>
            <Input
              id="targetAudience"
              placeholder={t("marketing.enterTargetAudience")}
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
