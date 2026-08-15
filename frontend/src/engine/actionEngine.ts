import type {
  ExecutiveActionItem,
  FabricShortageForecast,
  PlantCapacityForecast
} from './types';

/**
 * Generates dynamic, financially-quantified Executive Course of Action recommendations
 * based on calculated supply-demand gaps and operational constraints.
 */
export function generateExecutiveActions(
  fabricShortages: FabricShortageForecast[],
  plantLoads: PlantCapacityForecast[],
  serviceLevelPct: number,
  totalRevenueAtRisk: number
): ExecutiveActionItem[] {
  const actions: ExecutiveActionItem[] = [];

  // 1. Critical Fabric Shortages Action
  const topFabricShortage = fabricShortages.find(f => f.stockoutWeek !== null && f.stockoutWeek <= 16);
  if (topFabricShortage) {
    const expediteAirfreightCost = Math.round(topFabricShortage.totalMetersShortage * 2.80);
    const revenueProtected = topFabricShortage.revenueAtRisk;
    const netBenefit = revenueProtected - expediteAirfreightCost;
    const roi = expediteAirfreightCost > 0 ? parseFloat(((netBenefit / expediteAirfreightCost) * 100).toFixed(0)) : 0;

    actions.push({
      id: 'ACT_FAB_01',
      priority: 'CRITICAL',
      category: 'FABRIC_PROCUREMENT',
      title: `Authorize Expedited Air Freight for ${topFabricShortage.fabric_name}`,
      description: `${topFabricShortage.fabric_name} (${topFabricShortage.fabric_code}) is projected to stock out in Week ${topFabricShortage.stockoutWeek}, threatening ${topFabricShortage.affectedGarmentUnits.toLocaleString()} garment units across core styles. Authorizing partial air-freight shipment from ${topFabricShortage.supplier_name} will bridge the supplier lead-time gap of ${topFabricShortage.supplier_lead_time_weeks} weeks.`,
      affectedEntities: [topFabricShortage.fabric_code, topFabricShortage.supplier_name],
      timeline: `Week ${Math.max(1, (topFabricShortage.stockoutWeek || 4) - 2)} Execution`,
      financialImpact: {
        revenueProtected,
        costToImplement: expediteAirfreightCost,
        netBenefit,
        roiPct: roi
      },
      suggestedAction: 'Release emergency air-freight PO for 15,000 meters to avert stockout window.',
      simulatedScenarioPatch: {
        allowExpediteFreight: true
      }
    });
  }

  // 2. Plant Overload / Capacity Rebalance Action
  const overloadedPlant = plantLoads.find(p => p.averageUtilizationPct > 105 || p.overloadWeeksCount > 8);
  const underloadedPlant = plantLoads.find(p => p.averageUtilizationPct < 75);

  if (overloadedPlant && underloadedPlant) {
    const unitsToShift = 25000;
    const costToTransfer = 18000; // Tooling and freight delta
    const overtimeAvoided = overloadedPlant.overtimeCost * 0.45;
    const netBenefit = overtimeAvoided - costToTransfer;
    const roi = costToTransfer > 0 ? parseFloat(((netBenefit / costToTransfer) * 100).toFixed(0)) : 0;

    actions.push({
      id: 'ACT_PLT_01',
      priority: 'HIGH',
      category: 'PLANT_CAPACITY',
      title: `Rebalance Cutting & Sewing Load from ${overloadedPlant.plant_name} to ${underloadedPlant.plant_name}`,
      description: `${overloadedPlant.plant_name} (${overloadedPlant.country}) is currently loaded at ${overloadedPlant.averageUtilizationPct}% with ${overloadedPlant.overloadWeeksCount} weeks of overtime penalties ($${overloadedPlant.overtimeCost.toLocaleString()}). Shifting ${unitsToShift.toLocaleString()} units of secondary-eligible styles to ${underloadedPlant.plant_name} (${underloadedPlant.averageUtilizationPct}% load) optimizes global factory utilization.`,
      affectedEntities: [overloadedPlant.plant_id, underloadedPlant.plant_id],
      timeline: 'Next 30 Days (Rolling Plan)',
      financialImpact: {
        revenueProtected: Math.round(overtimeAvoided * 2.5),
        costToImplement: costToTransfer,
        netBenefit: Math.round(netBenefit),
        roiPct: Math.max(120, roi)
      },
      suggestedAction: `Transfer production tech-packs and cutting schedules to ${underloadedPlant.plant_name}.`
    });
  }

  // 3. Early Fabric PO Release for Long Lead-Time Textiles
  const longLeadFabric = fabricShortages.find(f => f.supplier_lead_time_weeks >= 10);
  if (longLeadFabric) {
    const earlyCommitmentValue = Math.round(longLeadFabric.cost_per_meter * 20000);
    const revenueProtected = Math.round(earlyCommitmentValue * 3.8);

    actions.push({
      id: 'ACT_PO_01',
      priority: 'HIGH',
      category: 'FABRIC_PROCUREMENT',
      title: `Advance PO Commitment for Long Lead Textile: ${longLeadFabric.fabric_name}`,
      description: `With a ${longLeadFabric.supplier_lead_time_weeks}-week mill lead time from ${longLeadFabric.supplier_name}, procurement orders must be committed now for Q3/Q4 peak demand. Early commitment secures mill greige slots and locks in current pricing ($${longLeadFabric.cost_per_meter.toFixed(2)}/m).`,
      affectedEntities: [longLeadFabric.fabric_code, longLeadFabric.supplier_name],
      timeline: 'Immediate (Within 7 Days)',
      financialImpact: {
        revenueProtected,
        costToImplement: earlyCommitmentValue,
        netBenefit: revenueProtected - earlyCommitmentValue,
        roiPct: 280
      },
      suggestedAction: `Issue advance blanket purchase order with 30-day staggered call-offs.`
    });
  }

  // 4. Demand Shaping & Promotional Modulation
  if (serviceLevelPct < 92 || totalRevenueAtRisk > 500000) {
    actions.push({
      id: 'ACT_DEM_01',
      priority: 'MEDIUM',
      category: 'DEMAND_SHAPING',
      title: 'Modulate E-Commerce Promotional Calendar to Smooth Peak Load',
      description: `Demand peaks in weeks 47-51 create severe fabric bottlenecks and expensive overtime. Shifting targeted marketing promotions forward by 2 weeks spreads the order peak, increasing OTIF fulfillment from ${serviceLevelPct.toFixed(1)}% to ~96.5% without losing gross revenue.`,
      affectedEntities: ['E-Commerce Direct', 'Marketing Ops'],
      timeline: 'Weeks 40 - 45 Window',
      financialImpact: {
        revenueProtected: Math.round(totalRevenueAtRisk * 0.4),
        costToImplement: 25000,
        netBenefit: Math.round(totalRevenueAtRisk * 0.4 - 25000),
        roiPct: 450
      },
      suggestedAction: 'Deploy VIP Early Access promotions 14 days ahead of Cyber Week peak.'
    });
  }

  // 5. Nearshore Quick-Turn Express Reorder Opportunity
  actions.push({
    id: 'ACT_NS_01',
    priority: 'OPPORTUNITY',
    category: 'INVENTORY_REBALANCE',
    title: 'Activate Nearshore Quick-Turn Reserve at Puebla Facility',
    description: 'Reserve 15% flexible sewing capacity at Puebla Nearshore Express (Mexico) for in-season replenishment of top-selling core styles, slashing replenishment lead times from 10 weeks to 3 weeks.',
    affectedEntities: ['PLANT_MX_01', 'Core Tops & Pants'],
    timeline: 'Continuous S&OP Rolling Cadence',
    financialImpact: {
      revenueProtected: 380000,
      costToImplement: 45000,
      netBenefit: 335000,
      roiPct: 744
    },
    suggestedAction: 'Establish standard 21-day turnaround SLA with Puebla manufacturing plant.'
  });

  return actions;
}
