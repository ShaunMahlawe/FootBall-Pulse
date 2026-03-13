import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function StatsChart() {

  const data = {
    labels: ["Defense", "Passes", "Tackles", "Goals"],
    datasets: [
      {
        data: [30, 5, 17, 48],
        backgroundColor: [
          "#ed1c24",
          "#2ecc71",
          "#3498db",
          "#f1c40f"
        ]
      }
    ]
  };

  return (
    <div className="pie-chartbox">

      <h2 className="chart-heading">
        Player Statistics
      </h2>

      <Pie data={data} />

    </div>
  );
}

export default StatsChart;