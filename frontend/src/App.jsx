import { useEffect, useState, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import axios from "axios"

export default function App() {
  const [data, setData] = useState([])
  const [status, setStatus] = useState("connecting...")
  const [lastUpdate, setLastUpdate] = useState(null)
  const tickRef = useRef(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:8000/metrics")
        const formatted = res.data.map(d => ({
          ...d,
          time: new Date(d.timestamp * 1000).toLocaleTimeString(),
          anomalyVal: d.anomaly ? 50 : null
        }))
        setData(formatted.slice(-30))
        setStatus("live")
        setLastUpdate(new Date().toLocaleTimeString())
      } catch {
        setStatus("disconnected")
      }
    }
    fetchData()
    const id = setInterval(fetchData, 2000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      tickRef.current += 1
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const latest = data[data.length - 1] || {}

  const getColor = val => val > 85 ? "#E24B4A" : val > 60 ? "#EF9F27" : "#1D9E75"
  const getLabel = val => val > 85 ? "Critical" : val > 60 ? "Warning" : "Normal"

  const Gauge = ({ label, value }) => {
    const pct = value || 0
    const color = getColor(pct)
    return (
      <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>{label}</p>
          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px",
            background: color + "22", color: color }}>{getLabel(pct)}</span>
        </div>
        <p style={{ fontSize: "36px", fontWeight: 500, margin: "0 0 10px", color }}>{pct.toFixed(1)}%</p>
        <div style={{ background: "#2a2a2a", borderRadius: "99px", height: "6px", overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "6px", background: color,
            borderRadius: "99px", transition: "width 0.8s ease" }} />
        </div>
      </div>
    )
  }

  const NetworkCard = () => {
    const prev = data[data.length - 2]
    const curr = data[data.length - 1]
    const sentKB = prev && curr ? ((curr.net_sent - prev.net_sent) / 1024).toFixed(1) : "0.0"
    const recvKB = prev && curr ? ((curr.net_recv - prev.net_recv) / 1024).toFixed(1) : "0.0"
    return (
      <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "1.25rem" }}>
        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 10px" }}>Network traffic</p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <div>
            <p style={{ color: "#444", fontSize: "11px", margin: "0 0 4px" }}>Sent</p>
            <p style={{ color: "#534AB7", fontSize: "20px", fontWeight: 500, margin: 0 }}>{sentKB} KB/s</p>
          </div>
          <div>
            <p style={{ color: "#444", fontSize: "11px", margin: "0 0 4px" }}>Received</p>
            <p style={{ color: "#1D9E75", fontSize: "20px", fontWeight: 500, margin: 0 }}>{recvKB} KB/s</p>
          </div>
        </div>
      </div>
    )
  }

  const anomalyCount = data.filter(d => d.anomaly).length

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", background: "#0f0f0f", minHeight: "100vh", color: "#fff" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "20px", margin: "0 0 4px" }}>Cloud Monitor Dashboard</h1>
          <p style={{ color: "#444", fontSize: "12px", margin: 0 }}>Harsh's system · refreshes every 2s</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {anomalyCount > 0 && (
            <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "99px",
              background: "#E24B4A22", color: "#E24B4A" }}>
              {anomalyCount} anomaly detected
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%",
              background: status === "live" ? "#1D9E75" : "#E24B4A" }} />
            <span style={{ fontSize: "12px", color: status === "live" ? "#1D9E75" : "#E24B4A" }}>
              {status === "live" ? `Live · ${lastUpdate}` : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "12px" }}>
        <Gauge label="CPU usage" value={latest.cpu} />
        <Gauge label="RAM usage" value={latest.ram} />
        <Gauge label="Disk usage" value={latest.disk} />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <NetworkCard />
      </div>

      <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "1.25rem", marginBottom: "12px" }}>
        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 1rem" }}>
          CPU, RAM & Disk — live (last 30 readings) · red dots = AI anomaly
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <XAxis dataKey="time" tick={{ fill: "#444", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fill: "#444", fontSize: 10 }} unit="%" />
            <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <ReferenceLine y={85} stroke="#E24B4A" strokeDasharray="4 4" label={{ value: "critical", fill: "#E24B4A", fontSize: 10 }} />
            <ReferenceLine y={60} stroke="#EF9F27" strokeDasharray="4 4" label={{ value: "warning", fill: "#EF9F27", fontSize: 10 }} />
            <Line isAnimationActive={false} type="monotone" dataKey="cpu" stroke="#534AB7" dot={false} strokeWidth={2} name="CPU %" />
            <Line isAnimationActive={false} type="monotone" dataKey="ram" stroke="#1D9E75" dot={false} strokeWidth={2} name="RAM %" />
            <Line isAnimationActive={false} type="monotone" dataKey="disk" stroke="#EF9F27" dot={false} strokeWidth={2} name="Disk %" />
            <Line isAnimationActive={false} type="monotone" dataKey="anomalyVal" stroke="#E24B4A"
              dot={(props) => {
                const { cx, cy, payload } = props
                if (!payload.anomaly) return <g key={`dot-${cx}-${cy}`}></g>
                return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={6} fill="#E24B4A" stroke="#fff" strokeWidth={2} />
              }}
              strokeWidth={0} name="Anomaly"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}