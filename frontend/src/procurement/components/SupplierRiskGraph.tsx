import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface AllocationData {
  supplier_id: string;
  supplier_name: string;
  material_id: string;
  unit_price: number;
  risk_probability: number;
  allocated_quantity: number;
}

interface Props {
  data: AllocationData[];
}

export const SupplierRiskGraph: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear previous

    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.unit_price) || 100])
      .range([0, innerWidth])
      .nice();

    const y = d3.scaleLinear()
      .domain([0, 100]) // Risk probability is 0-100%
      .range([innerHeight, 0]);

    const size = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.allocated_quantity) || 100])
      .range([4, 20]);

    const color = d3.scaleThreshold<number, string>()
      .domain([30, 70])
      .range(["#10b981", "#f59e0b", "#f43f5e"]); // Low, Med, High risk colors

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `$${d}`))
      .attr("color", "#64748b");
    
    // X Axis Label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 35)
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text("Unit Price ($)");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .attr("color", "#64748b");

    // Y Axis Label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -35)
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text("Risk Probability (%)");

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => ""))
      .attr("color", "#1e293b")
      .attr("stroke-dasharray", "3,3");

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "#0f172a")
      .style("color", "#f8fafc")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("border", "1px solid #334155")
      .style("pointer-events", "none")
      .style("z-index", "100");

    // Dots
    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.unit_price))
      .attr("cy", d => y(d.risk_probability))
      .attr("r", d => size(d.allocated_quantity))
      .attr("fill", d => color(d.risk_probability))
      .attr("opacity", 0.8)
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
        tooltip.style("visibility", "visible")
          .html(`
            <strong>${d.supplier_name}</strong><br/>
            Price: $${d.unit_price}<br/>
            Risk: ${d.risk_probability}%<br/>
            Allocation: ${d.allocated_quantity}
          `);
      })
      .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 1);
        tooltip.style("visibility", "hidden");
      });

    // Cleanup tooltip on unmount
    return () => {
      d3.select(".d3-tooltip").remove();
    };
  }, [data]);

  return (
    <div className="w-full flex justify-center">
      <svg ref={svgRef} width="100%" height="300" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
  );
};
