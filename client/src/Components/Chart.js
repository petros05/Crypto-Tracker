// src/components/Chart.js
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import "../App.css";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Title,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Title,
  Legend
);

function makeBaselinePlugin(baseline) {
  return {
    id: "baselinePlugin",
    afterDatasetsDraw(chart) {
      if (baseline == null) return;
      const {
        ctx,
        chartArea: { left, right },
        scales: { y },
      } = chart;
      const yPos = y.getPixelForValue(baseline);
      
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(100,100,100,0.8)";
      ctx.moveTo(left, yPos);
      ctx.lineTo(right, yPos);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(60,60,60,0.9)";
      ctx.font = "10px sans-serif";
      ctx.textBaseline = "bottom";
      ctx.fillText(`$${baseline.toFixed(2)}`, left + 4, yPos - 2);
      ctx.restore();
    },
  };
}

const PriceChart = ({ coin }) => {
  const baseline = coin.price?.[0] ?? null;

  const data = useMemo(
    () => ({
      labels: coin.time,
      datasets: [
        {
          label: "Price",
          data: coin.price,
          borderColor: "#4070f4",
          backgroundColor: "rgba(64, 112, 244, 0.2)", // same color with opacity
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    }),
    [coin.time, coin.price]
  );

  const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#fff",      // White background
      titleColor: "#000",           // Title text color
      bodyColor: "#000",            // Price text color
      bodyFont: { size: 14, weight: 'bold' }, // Larger price text
      padding: 10,
      cornerRadius: 8,              // Rounded corners
      displayColors: false,         // Remove color box
      borderColor: "rgba(0,0,0,0.1)",
      borderWidth: 1,
      callbacks: {
        title: () => "",            // Remove title (time/date)
        label: (context) => `Price: $${context.parsed.y.toLocaleString()}`,
      },
      caretSize: 6,                 // Arrow size
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { 
        color: "#666",
        rotation: 0,  // Make dates straight (horizontal)
        maxTicksLimit: 8 // Limit number of x-axis labels
      },
    },
    y: {
      grid: { color: "rgba(0,0,0,0.05)" },
      ticks: { 
        color: "#666",
        callback: function(value) {
          return '$' + value.toLocaleString();
        }
      },
    },
  },
};

  return (
    <div
      style={{
        width: "100%",
        height: "400px",
        position: "relative",
      }}
    >
      <Line data={data} options={options} plugins={[makeBaselinePlugin(baseline)]} />
    </div>
  );
};

export default PriceChart;
