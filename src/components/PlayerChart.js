import { Pie } from "react-chartjs-2";
import {
Chart as ChartJS,
ArcElement,
Tooltip,
Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
labels: ["Defense", "Passes", "Tackles", "Goals"],
datasets: [
{
data: [30,5,17,48],
backgroundColor: [
"#3498db",
"#2ecc71",
"#f39c12",
"#e74c3c"
]
}
]
};

function PlayerChart() {
return <Pie data={data} />;
}

export default PlayerChart;