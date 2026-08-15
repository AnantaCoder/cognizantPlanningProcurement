import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, sankeyCenter } from 'd3-sankey';

interface AllocationData {
  supplier_id: string;
  supplier_name: string;
  material_id: string;
  allocated_quantity: number;
}

interface Props {
  data: AllocationData[];
}

export const AllocationPipelineGraph: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Build unique nodes
    const materials = Array.from(new Set(data.map(d => d.material_id)));
    const suppliers = Array.from(new Set(data.map(d => d.supplier_name)));
    
    const nodes = [...materials, ...suppliers].map(name => ({ name }));
    const nodeMap = new Map(nodes.map((n, i) => [n.name, i]));

    const links = data
      .filter(d => d.allocated_quantity > 0)
      .map(d => ({
        source: nodeMap.get(d.material_id)!,
        target: nodeMap.get(d.supplier_name)!,
        value: d.allocated_quantity
      }));

    if (links.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear previous

    const width = 600;
    const height = 300;

    const sankeyGenerator = sankey<any, any>()
      .nodeWidth(15)
      .nodePadding(20)
      .extent([[10, 10], [width - 10, height - 10]])
      .nodeAlign(sankeyCenter);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: nodes.map(d => Object.assign({}, d)),
      links: links.map(d => Object.assign({}, d))
    });

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Links
    svg.append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.4)
      .selectAll("g")
      .data(sankeyLinks)
      .join("g")
      .style("mix-blend-mode", "screen")
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", d => color((d.source as any).name))
      .attr("stroke-width", d => Math.max(1, d.width!))
      .append("title")
      .text(d => `${(d.source as any).name} → ${(d.target as any).name}\n${d.value}`);

    // Nodes
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(sankeyNodes)
      .join("g");

    nodeGroup.append("rect")
      .attr("x", d => d.x0!)
      .attr("y", d => d.y0!)
      .attr("height", d => d.y1! - d.y0!)
      .attr("width", d => d.x1! - d.x0!)
      .attr("fill", d => color(d.name))
      .attr("stroke", "#000")
      .append("title")
      .text(d => `${d.name}\nTotal: ${d.value}`);

    nodeGroup.append("text")
      .attr("x", d => d.x0! < width / 2 ? d.x1! + 6 : d.x0! - 6)
      .attr("y", d => (d.y1! + d.y0!) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0! < width / 2 ? "start" : "end")
      .attr("font-size", "10px")
      .attr("fill", "#f8fafc")
      .text(d => d.name);

  }, [data]);

  return (
    <div className="w-full flex justify-center">
      <svg ref={svgRef} width="100%" height="300" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
  );
};
