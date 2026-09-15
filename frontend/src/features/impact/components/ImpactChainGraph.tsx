"use client";

import React from "react";
import { ImpactNode, ImpactEdge } from "../types/impactTypes";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Truck,
  Package,
  Building,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface Props {
  nodes: ImpactNode[];
  edges: ImpactEdge[];
  summaryChain: string;
}

export const ImpactChainGraph: React.FC<Props> = ({
  nodes,
  edges,
  summaryChain,
}) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "INCIDENT":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "ROAD":
        return <MapPin className="w-4 h-4 text-amber-400" />;
      case "ROUTE":
        return <Navigation className="w-4 h-4 text-cyan-400" />;
      case "SHIPMENT":
        return <Package className="w-4 h-4 text-purple-400" />;
      case "DISTRICT":
      default:
        return <Building className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>Cascading Impact Chain Graph</span>
        </h3>
        <span className="text-[9px] font-mono text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Graph Analysis Engine
        </span>
      </div>

      {/* Summary Narrative Banner */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-medium leading-relaxed">
        {summaryChain}
      </div>

      {/* Step-by-Step Graph Chain Visualization */}
      <div className="space-y-2">
        {nodes.map((node, idx) => (
          <React.Fragment key={node.id}>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  {getNodeIcon(node.node_type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                      {node.node_type}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800 font-mono">
                      {node.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 truncate mt-0.5">
                    {node.name}
                  </h4>
                  {node.details && (
                    <p className="text-[11px] text-slate-400 truncate">{node.details}</p>
                  )}
                </div>
              </div>

              <div className="text-right font-mono shrink-0">
                <span className="text-xs font-extrabold text-red-400">
                  {node.risk_score}/100 Risk
                </span>
              </div>
            </div>

            {idx < nodes.length - 1 && (
              <div className="flex justify-center my-1">
                <div className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-cyan-400 border border-slate-800 flex items-center gap-1">
                  <span>{edges[idx]?.relationship || "CASCADES TO"}</span>
                  <ArrowRight className="w-3 h-3 rotate-90" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
