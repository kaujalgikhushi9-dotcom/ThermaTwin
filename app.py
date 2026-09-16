import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="ThermaTwin - Heat Risk Dashboard", layout="wide")

# Banner
st.warning("⚠️ All numbers shown are DEMONSTRATION/SIMULATED DATA for Phase 1 prototype")

st.title("🌡️ ThermaTwin - Ward Heat Risk Dashboard")
st.markdown("**Working Prototype:** Heat-Health Risk Engine for Municipal Decision Support")

# Mock data
wards = ['Ward A', 'Ward B', 'Ward C']
data = pd.DataFrame({
    'Ward': wards,
    'Heat Index (°C)': [38, 42, 45],
    'WBGT (°C)': [30, 33, 35],
    'Thermal Score': [65, 74, 82],
    'Ward Priority': [3, 2, 1],
    'Population Exposed (demo)': [185000, 120000, 95000]
})

# Sidebar
st.sidebar.header("Filters")
selected_ward = st.sidebar.selectbox("Select Ward", wards)

# Main metrics
col1, col2, col3 = st.columns(3)
col1.metric("Total Population (Demo)", "185,000")
col2.metric("Critical Wards", "2")
col3.metric("Peak Heat Hours", "12:30 PM – 4:30 PM")

# Charts
st.subheader("Ward Heat Metrics")
fig = px.bar(data, x='Ward', y='Heat Index (°C)', title='Heat Index by Ward (Estimated)')
st.plotly_chart(fig, use_container_width=True)

fig2 = px.bar(data, x='Ward', y='Thermal Score', title='Thermal Score by Ward (Research/Demo)')
st.plotly_chart(fig2, use_container_width=True)

# Methodology tooltip
with st.expander("ℹ️ How is Thermal Score calculated?"):
    st.write("""
    **Thermal Score** = Weighted combination of:
    - Heat Index (40%)
    - WBGT (30%)
    - Population Exposure (20%)
    - Vulnerability Index (10%)
    
    *Range: 0–100 (higher = more risk)*
    """)

# Data table
st.subheader("Ward Details")
st.dataframe(data.style.format({
    'Heat Index (°C)': '{:.1f}',
    'WBGT (°C)': '{:.1f}',
    'Thermal Score': '{:.0f}',
    'Population Exposed (demo)': '{:,}'
}))

st.info("📌 Data Labels: Heat Index = Estimated | WBGT = Estimated | Population = Demo Data | Cooling Centres = Configured for Prototype")