"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Form } from "@workspace/ui/components/form";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";
import {
  Boxes,
  Megaphone,
  Receipt,
  RotateCcw,
  Tag,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormInputField } from "@/components/forms/form-field";
import {
  BREAK_EVEN_NOTE,
  DEFAULT_SCENARIO,
  MARKETING_DISCLAIMER,
  NO_ORDERS_HINT,
  FIXED_PROJECTION_QUANTITIES,
  PREDICTION_RANGE_OPTIONS,
  SCENARIOS,
  SHIPPING_NOTE,
  STORAGE_KEY,
} from "./pricing-calculator.constants";
import {
  DEFAULT_FORM_VALUES,
  pricingCalculatorSchema,
  type PricingCalculatorFormValues,
} from "./pricing-calculator.schema";
import {
  calculatePricing,
  calculateProfitForQuantity,
  formatMoney,
  formatPercent,
  formatUnits,
  suggestDesiredMargin,
  toSafeNumber,
} from "./pricing-calculator.lib";
import {
  MetricTile,
  NumberField,
  ProjectionQuantityInput,
  ProjectionTile,
  ResultRow,
  ScenarioColumn,
  StatusBadge,
  profitToneClass,
} from "./pricing-calculator.chunks";
import type { ScenarioKey } from "./pricing-calculator.types";

export function PricingCalculatorClient() {
  const form = useForm<PricingCalculatorFormValues>({
    resolver: zodResolver(pricingCalculatorSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: "onChange",
  });

  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioKey>(DEFAULT_SCENARIO);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore after mount, never during render, so the server and client markup
  // agree on the first paint.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          form.reset({
            ...DEFAULT_FORM_VALUES,
            ...(parsed as Partial<PricingCalculatorFormValues>),
          });
        }
      }
    } catch {
      // Unreadable or blocked storage just means we start from defaults.
    }
    setIsHydrated(true);
  }, [form]);

  const values = useWatch({ control: form.control });

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // Storage may be unavailable; the calculator still works without it.
    }
  }, [values, isHydrated]);

  const result = useMemo(() => calculatePricing(values), [values]);
  const selected = result.scenarios[selectedScenario];

  const handleReset = () => {
    form.reset(DEFAULT_FORM_VALUES);
    setSelectedScenario(DEFAULT_SCENARIO);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear if storage is unavailable.
    }
  };

  const control = form.control;
  const hasShipping = result.shippingCost > 0;
  const productName = values.productName?.trim();

  // What the market price already earns, offered back as a target to aim at.
  const suggestedMargin = suggestDesiredMargin(selected.profitMargin);
  const canSuggestMargin =
    result.sellingPrice > 0 && selected.costPerItem !== null;

  // Display-only, and whole units: you cannot stock half an item.
  const projectionQuantity = Math.floor(toSafeNumber(values.projectionQuantity));

  return (
    <Form {...form}>
      <div className="space-y-6">
        <PageHeader
          title="Pricing Calculator"
          description="Estimate the true cost of a product, then find a selling price that actually makes money."
          actions={
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-6 items-start">
          {/* ---------------- Left column: inputs ---------------- */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-muted-foreground" />
                  Product Costs
                </CardTitle>
                <CardDescription>
                  What you spend to put one item in a customer&apos;s hands.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormInputField
                  control={control}
                  name="productName"
                  label="Product name (optional)"
                  placeholder="e.g. Wireless Earbuds"
                />
                <NumberField
                  control={control}
                  name="supplierPrice"
                  label="Supplier price per piece"
                  placeholder="150"
                  suffix="EGP"
                />
                <NumberField
                  control={control}
                  name="packagingCost"
                  label="Packaging cost per piece"
                  placeholder="10"
                  suffix="EGP"
                />
                <NumberField
                  control={control}
                  name="shippingCost"
                  label="Shipping cost per order"
                  placeholder="0"
                  suffix="EGP"
                  description={SHIPPING_NOTE}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  Marketing Cost
                </CardTitle>
                <CardDescription>
                  Two numbers from your Facebook, Instagram or TikTok ads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <NumberField
                  control={control}
                  name="dailyAdBudget"
                  label="Daily ad budget"
                  placeholder="1000"
                  suffix="EGP"
                  description="What you spend on ads per day."
                />

                <NumberField
                  control={control}
                  name="expectedOrders"
                  label="Orders you expect per day"
                  placeholder="15"
                  suffix="/ day"
                  description="Your realistic guess at how many orders the ads bring in."
                />

                <Separator />

                <div className="space-y-3">
                  <Label>How sure are you about that number?</Label>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={String(result.predictionRange)}
                    onValueChange={(next) => {
                      if (next) {
                        form.setValue("predictionRange", Number(next), {
                          shouldValidate: true,
                        });
                      }
                    }}
                    className="w-full"
                  >
                    {PREDICTION_RANGE_OPTIONS.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={String(option.value)}
                        aria-label={`${option.label} ${option.hint}`}
                        className="flex-1 flex-col h-auto py-2"
                      >
                        <span className="text-xs font-medium">
                          {option.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {option.hint}
                        </span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <p className="text-xs text-muted-foreground">
                    Used to work out a worse and a better case around your
                    guess, so you see a range instead of a single number.
                  </p>
                </div>

                {/* Plain-language readout of what those two inputs mean */}
                <div className="rounded-lg border bg-muted/40 p-3 space-y-3">
                  {result.scenarios.expected.marketingCostPerOrder === null ? (
                    <p className="text-xs text-muted-foreground">
                      {NO_ORDERS_HINT} to see your cost per order.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        At {formatMoney(result.dailyAdBudget)} a day and{" "}
                        {result.scenarios.expected.ordersPerDay} orders a day,
                        each order carries{" "}
                        <span className="font-semibold text-foreground tabular-nums">
                          {formatMoney(
                            result.scenarios.expected.marketingCostPerOrder
                          )}
                        </span>{" "}
                        of ad spend &mdash; your cost per order.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {result.scenarioList.map((scenario) => (
                          <div key={scenario.key}>
                            <p className="text-[10px] text-muted-foreground">
                              {scenario.label}
                            </p>
                            <p className="text-xs font-medium tabular-nums">
                              {formatMoney(scenario.marketingCostPerOrder)}
                            </p>
                            <p className="text-[10px] text-muted-foreground tabular-nums">
                              {scenario.ordersPerDay} orders/day
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {MARKETING_DISCLAIMER}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Price
                </CardTitle>
                <CardDescription>
                  The market price of the product itself, without delivery.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <NumberField
                  control={control}
                  name="sellingPrice"
                  label="Market / selling price"
                  placeholder="399"
                  suffix="EGP"
                  description="What the product alone sells for, delivery excluded."
                />

                <NumberField
                  control={control}
                  name="desiredMargin"
                  label="Desired profit margin"
                  placeholder="30"
                  suffix="%"
                  description="Share of the price you want to keep as profit."
                />

                {canSuggestMargin && (
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      At {formatMoney(result.sellingPrice)} the market gives you{" "}
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          profitToneClass(selected.profitMargin) ||
                            "text-foreground"
                        )}
                      >
                        {formatPercent(selected.profitMargin)}
                      </span>{" "}
                      in the {selected.label.toLowerCase()} case.
                    </p>

                    {suggestedMargin === null ? (
                      <p className="text-xs text-muted-foreground">
                        That is too thin to set a target against &mdash; the
                        market price barely clears your cost.
                      </p>
                    ) : (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          Suggested target:{" "}
                          <span className="font-semibold text-foreground tabular-nums">
                            {suggestedMargin}%
                          </span>{" "}
                          &mdash; keeps your price at or under the market.
                        </p>
                        {result.desiredMargin === suggestedMargin ? (
                          <span className="text-xs text-muted-foreground shrink-0">
                            Applied
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() =>
                              form.setValue("desiredMargin", suggestedMargin, {
                                shouldValidate: true,
                              })
                            }
                          >
                            Use {suggestedMargin}%
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ---------------- Right column: results ---------------- */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      {productName ? productName : "Verdict"}
                    </CardTitle>
                    <CardDescription>
                      Based on the {selected.label.toLowerCase()} case.
                    </CardDescription>
                  </div>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={selectedScenario}
                    onValueChange={(next) => {
                      if (next) setSelectedScenario(next as ScenarioKey);
                    }}
                  >
                    {SCENARIOS.map((scenario) => (
                      <ToggleGroupItem
                        key={scenario.key}
                        value={scenario.key}
                        aria-label={scenario.label}
                        className="px-3 text-xs"
                      >
                        {scenario.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </CardHeader>
              <CardContent>
                {selected.costPerItem === null ? (
                  <p className="text-sm text-muted-foreground">
                    {NO_ORDERS_HINT}.
                  </p>
                ) : result.sellingPrice <= 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Enter a market price to see whether it is profitable.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusBadge status={selected.status} />
                      <span className="text-xs text-muted-foreground">
                        {selected.ordersPerDay} orders/day assumed
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <MetricTile
                        label="Profit per item"
                        value={formatMoney(selected.profitPerItem)}
                        valueClassName={profitToneClass(selected.profitPerItem)}
                      />
                      <MetricTile
                        label="Profit margin"
                        value={formatPercent(selected.profitMargin)}
                        valueClassName={profitToneClass(selected.profitMargin)}
                        hint={`Target ${formatPercent(result.desiredMargin)}`}
                      />
                      <MetricTile
                        label="Customer pays"
                        value={formatMoney(result.listedPrice)}
                        hint={
                          hasShipping
                            ? `${formatMoney(result.sellingPrice)} + ${formatMoney(result.shippingCost)} delivery`
                            : "No delivery cost set"
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  Cost Breakdown
                </CardTitle>
                <CardDescription>
                  What one sold item costs you in the{" "}
                  {selected.label.toLowerCase()} case.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <ResultRow
                    label="Supplier"
                    value={formatMoney(result.supplierPrice)}
                  />
                  <ResultRow
                    label="Packaging"
                    value={formatMoney(result.packagingCost)}
                  />
                  <ResultRow
                    label="Marketing"
                    value={formatMoney(selected.marketingCostPerOrder)}
                    hint={
                      selected.marketingCostPerOrder === null
                        ? NO_ORDERS_HINT
                        : `${formatMoney(result.dailyAdBudget)} a day over ${selected.ordersPerDay} orders`
                    }
                  />
                  <Separator />
                  <ResultRow
                    label="Cost per item"
                    value={formatMoney(selected.costPerItem)}
                    hint="Profit and margin are measured against this."
                    emphasis
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <ResultRow
                    label="Shipping (passed through)"
                    value={formatMoney(result.shippingCost)}
                    hint={SHIPPING_NOTE}
                    muted
                  />
                  <ResultRow
                    label="Cash out per order"
                    value={formatMoney(selected.cashOutPerOrder)}
                    hint="Cost per item plus the delivery you pay the courier."
                    muted
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Recommended Price
                </CardTitle>
                <CardDescription>
                  Priced back from your {formatPercent(result.desiredMargin)}{" "}
                  target margin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selected.recommendedPrice === null ? (
                  <p className="text-sm text-muted-foreground">
                    {selected.costPerItem === null
                      ? `${NO_ORDERS_HINT}.`
                      : "Enter product costs and a margin below 100% to see a recommended price."}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <MetricTile
                        label="Product price"
                        value={formatMoney(selected.recommendedPrice)}
                        hint={`Rounded up from ${formatMoney(selected.recommendedPriceExact)}`}
                      />
                      <MetricTile
                        label="Customer pays"
                        value={formatMoney(selected.recommendedListedPrice)}
                        hint={
                          hasShipping
                            ? `With ${formatMoney(result.shippingCost)} delivery added`
                            : "No delivery cost set"
                        }
                      />
                    </div>
                    <div className="space-y-3">
                      <ResultRow
                        label="Profit at that price"
                        value={formatMoney(selected.profitAtRecommendedPrice)}
                        valueClassName={profitToneClass(
                          selected.profitAtRecommendedPrice
                        )}
                      />
                      <ResultRow
                        label="Margin at that price"
                        value={formatPercent(selected.marginAtRecommendedPrice)}
                        valueClassName={profitToneClass(
                          selected.marginAtRecommendedPrice
                        )}
                      />
                      <Separator />
                      <ResultRow
                        label="Break-even product price"
                        value={formatMoney(selected.breakEvenPrice)}
                        hint={BREAK_EVEN_NOTE}
                      />
                      {hasShipping && (
                        <ResultRow
                          label="Break-even, customer pays"
                          value={formatMoney(selected.breakEvenListedPrice)}
                          muted
                        />
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Profit Analysis
                </CardTitle>
                <CardDescription>
                  Your market price measured against all three cases. Margin is
                  profit as a share of the product price.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.scenarioList.map((scenario) => (
                    <ScenarioColumn
                      key={scenario.key}
                      scenario={scenario}
                      sellingPrice={result.sellingPrice}
                      isSelected={scenario.key === selectedScenario}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profit Projection</CardTitle>
                <CardDescription>
                  Profit at your market price, with the supplier cost it takes
                  to stock each batch.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selected.profitPerItem === null ? (
                  <p className="text-sm text-muted-foreground">
                    {selected.costPerItem === null
                      ? `${NO_ORDERS_HINT}.`
                      : "Enter a market price to project profit."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {FIXED_PROJECTION_QUANTITIES.map((quantity) => (
                      <ProjectionTile
                        key={quantity}
                        quantity={quantity}
                        label={`${formatUnits(quantity)} ${quantity === 1 ? "item" : "items"}`}
                        profit={calculateProfitForQuantity(
                          selected.profitPerItem,
                          quantity
                        )}
                        supplierOutlay={result.supplierPrice * quantity}
                      />
                    ))}
                    <ProjectionTile
                      quantity={projectionQuantity}
                      label={
                        <ProjectionQuantityInput
                          control={control}
                          name="projectionQuantity"
                        />
                      }
                      profit={calculateProfitForQuantity(
                        selected.profitPerItem,
                        projectionQuantity
                      )}
                      supplierOutlay={result.supplierPrice * projectionQuantity}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Form>
  );
}
