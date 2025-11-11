import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const STORAGE_KEY = "device_label";

function sanitizeLabel(input: string): string {
	const trimmed = (input || "").trim();
	// Allow letters, numbers, dash, underscore, and space; clamp length
	return trimmed.replace(/[^A-Za-z0-9 _-]/g, "").slice(0, 64);
}

const SetupPage: React.FC = () => {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const [current, setCurrent] = useState<string>("");
	const [status, setStatus] = useState<string>("");

	const incoming = useMemo(() => {
		const q = params.get("device") || params.get("label") || "";
		return sanitizeLabel(q);
	}, [params]);

	useEffect(() => {
		// Prefer URL param on first load; otherwise read stored
		const stored = localStorage.getItem(STORAGE_KEY) || "";
		if (incoming) {
			localStorage.setItem(STORAGE_KEY, incoming);
			setCurrent(incoming);
			setStatus(`Saved device label: ${incoming}`);
		} else if (stored) {
			setCurrent(stored);
		}
	}, [incoming]);

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		const clean = sanitizeLabel(current);
		if (!clean) {
			setStatus("Please enter a valid label (e.g., Oppo-1, Samsung-2).");
			return;
		}
		localStorage.setItem(STORAGE_KEY, clean);
		setCurrent(clean);
		setStatus(`Saved device label: ${clean}`);
	};

	return (
		<div style={{ maxWidth: 520, margin: "40px auto", padding: "16px" }}>
			<h1 style={{ marginBottom: 12 }}>Device Setup</h1>
			<p style={{ marginBottom: 16 }}>
				Assign a unique label to this device (e.g., <b>Oppo-1</b>, <b>Oppo-2</b>, <b>Samsung-1</b>).
				The app will include this label in future requests so the backend can distinguish devices.
			</p>

			<form onSubmit={handleSave} noValidate>
				<label htmlFor="deviceLabel" style={{ display: "block", marginBottom: 8 }}>
					Device label
				</label>
				<input
					id="deviceLabel"
					type="text"
					value={current}
					onChange={(e) => setCurrent(sanitizeLabel(e.target.value))}
					placeholder="e.g., Oppo-1"
					style={{
						width: "100%",
						padding: "10px 12px",
						fontSize: 16,
						borderRadius: 6,
						border: "1px solid #ccc",
						marginBottom: 12,
					}}
				/>
				<button
					type="submit"
					style={{
						padding: "10px 14px",
						borderRadius: 6,
						border: 0,
						background: "#5b21b6",
						color: "#fff",
						cursor: "pointer",
					}}
				>
					Save label
				</button>
				<button
					type="button"
					onClick={() => navigate("/")}
					style={{
						padding: "10px 14px",
						borderRadius: 6,
						border: "1px solid #ddd",
						background: "#fff",
						color: "#111",
						cursor: "pointer",
						marginLeft: 8,
					}}
				>
					Back to app
				</button>
			</form>

			{status ? (
				<div style={{ marginTop: 12, color: "#065f46" }}>{status}</div>
			) : null}

			<div style={{ marginTop: 24, fontSize: 14, color: "#444" }}>
				<p style={{ marginBottom: 8 }}>
					You can also set via URL: <code>?device=Oppo-1</code> or <code>?label=Samsung-2</code>
				</p>
				<p style={{ margin: 0 }}>
					Stored under <code>localStorage["device_label"]</code>.
				</p>
			</div>
		</div>
	);
};

export default SetupPage;


