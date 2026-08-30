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
import { Separator } from "@workspace/ui/components/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
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
  FREE_DELIVERY_NOTE,
  MARKETING_DISCLAIMER,
  NO_ORDERS_HINT,
  PROFIT_PROJECTION_QUANTITIES,
  SCENARIOS,
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
} from "./pricing-calculator.lib";
import {
  MetricTile,
  NumberField,
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product</CardTitle>
            <CardDescription>
              Optional label for this calculation. Nothing here is saved to the
              catalogue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormInputField
              control={control}
              name="productName"
              label="Product name"
              placeholder="e.g. Wireless Earbuds"
            />
          </CardContent>
        </Card>

        {/* Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <NumberField
                control={control}
                name="supplierPrice"
                label="Supplier price per piece"
                placeholder="150"
                description="Base product acquisition cost."
              />
              <NumberField
                control={control}
                name="packagingCost"
                label="Packaging cost per piece"
                placeholder="10"
              />
              <NumberField
                control={control}
                name="shippingCost"
                label="Shipping cost per order"
                placeholder="0"
                description={FREE_DELIVERY_NOTE}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                Marketing Cost
              </CardTitle>
              <CardDescription>{MARKETING_DISCLAIMER}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <NumberField
                control={control}
                name="dailyAdBudget"
                label="Daily ad budget"
                placeholder="1000"
                description="Total advertising spend per day, in EGP."
              />

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Marketing Prediction</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimated orders per day. These are estimates, not
                    guarantees &mdash; edit them to match what you expect.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SCENARIOS.map((scenario) => {
                    const scenarioResult = result.scenarios[scenario.key];
                    return (
                      <div key={scenario.key} className="space-y-2">
                        <NumberField
                          control={control}
                          name={scenario.ordersField}
                          label={scenario.label}
                          placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {scenarioResult.marketingCostPerOrder === null
                            ? NO_ORDERS_HINT
                            : `${formatMoney(scenarioResult.marketingCostPerOrder)} / order`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Cost Breakdown
            </CardTitle>
            <CardDescription>
              Everything the business spends per sold item.
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
                label="Shipping"
                value={formatMoney(result.shippingCost)}
                hint={FREE_DELIVERY_NOTE}
              />
              <Separator />
              <ResultRow
                label="Subtotal before marketing"
                value={formatMoney(result.baseCost)}
                emphasis
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.scenarioList.map((scenario) => (
                <MetricTile
                  key={scenario.key}
                  label={`${scenario.label} total`}
                  value={formatMoney(scenario.totalCost)}
                  hint={
                    scenario.marketingCostPerOrder === null
                      ? NO_ORDERS_HINT
                      : `Includes ${formatMoney(scenario.marketingCostPerOrder)} marketing`
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scenario selector — drives every section below it */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planning scenario</CardTitle>
            <CardDescription>
              Choose which marketing estimate the price, break-even and
              projections below are based on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              type="single"
              variant="outline"
              value={selectedScenario}
              onValueChange={(value) => {
                if (value) setSelectedScenario(value as ScenarioKey);
              }}
              className="w-full sm:w-auto sm:inline-flex"
            >
              {SCENARIOS.map((scenario) => (
                <ToggleGroupItem
                  key={scenario.key}
                  value={scenario.key}
                  aria-label={scenario.label}
                  className="px-4"
                >
                  {scenario.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-muted-foreground mt-3">
              {SCENARIOS.find((s) => s.key === selectedScenario)?.description}
            </p>
          </CardContent>
        </Card>

        {/* Market price vs recommended price */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Market Price
              </CardTitle>
              <CardDescription>
                The price you see in the market, or the one you are considering.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <NumberField
                control={control}
                name="sellingPrice"
                label="Market / selling price"
                placeholder="399"
              />

              {selected.totalCost === null ? (
                <p className="text-sm text-muted-foreground">{NO_ORDERS_HINT}</p>
              ) : result.sellingPrice <= 0 ? (
                <p className="text-sm text-muted-foreground">
                  Enter a selling price to see whether it is profitable.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selected.label} scenario
                    </span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <ResultRow
                    label="Total cost"
                    value={formatMoney(selected.totalCost)}
                  />
                  <ResultRow
                    label="Profit per item"
                    value={formatMoney(selected.profitPerItem)}
                    valueClassName={profitToneClass(selected.profitPerItem)}
                  />
                  <ResultRow
                    label="Profit margin"
                    value={formatPercent(selected.profitMargin)}
                    valueClassName={profitToneClass(selected.profitMargin)}
                    emphasis
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Recommended Product Price
              </CardTitle>
              <CardDescription>
                Priced back from the margin you want, using the {selected.label}{" "}
                total cost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <NumberField
                control={control}
                name="desiredMargin"
                label="Desired profit margin (%)"
                placeholder="30"
                description="Share of the selling price you want to keep as profit."
              />

              {selected.recommendedPrice === null ? (
                <p className="text-sm text-muted-foreground">
                  {selected.totalCost === null
                    ? NO_ORDERS_HINT
                    : "Enter product costs and a margin below 100% to see a recommended price."}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Recommended price
                    </p>
                    <p className="text-3xl font-bold tabular-nums mt-1">
                      {formatMoney(selected.recommendedPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rounded up from{" "}
                      {formatMoney(selected.recommendedPriceExact)} to a
                      practical price.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <ResultRow
                      label="Break-even price"
                      value={formatMoney(selected.breakEvenPrice)}
                      hint={BREAK_EVEN_NOTE}
                    />
                    <ResultRow
                      label="Desired margin"
                      value={formatPercent(result.desiredMargin)}
                    />
                    <ResultRow
                      label="Profit at recommended price"
                      value={formatMoney(selected.profitAtRecommendedPrice)}
                      valueClassName={profitToneClass(
                        selected.profitAtRecommendedPrice
                      )}
                    />
                    <ResultRow
                      label="Margin at recommended price"
                      value={formatPercent(selected.marginAtRecommendedPrice)}
                      valueClassName={profitToneClass(
                        selected.marginAtRecommendedPrice
                      )}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profit analysis across all three scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Profit Analysis
            </CardTitle>
            <CardDescription>
              Your selling price measured against all three marketing estimates.
              Margin is profit as a share of the selling price.
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

        {/* Volume projection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profit Projection</CardTitle>
            <CardDescription>
              Estimated profit at your selling price, {selected.label} scenario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selected.profitPerItem === null ? (
              <p className="text-sm text-muted-foreground">
                {selected.totalCost === null
                  ? NO_ORDERS_HINT
                  : "Enter a selling price to project profit."}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROFIT_PROJECTION_QUANTITIES.map((quantity) => {
                  const projected = calculateProfitForQuantity(
                    selected.profitPerItem,
                    quantity
                  );
                  return (
                    <MetricTile
                      key={quantity}
                      label={`${formatUnits(quantity)} ${quantity === 1 ? "item" : "items"}`}
                      value={formatMoney(projected)}
                      valueClassName={profitToneClass(projected)}
                      hint={`${formatMoney(selected.profitPerItem)} per item`}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
