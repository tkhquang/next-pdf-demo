"use client";

import {
  LineChart,
  XAxis,
  YAxis,
  ReferenceArea,
  Label,
  ReferenceDot,
  ReferenceLine,
  Line,
  ResponsiveContainer,
} from "recharts";

const referenceValue = {
  x: 95,
  y: 130,
};

function SegmentedLineChart() {
  return (
    <ResponsiveContainer width="100%" height="auto" aspect={1344 / 516}>
      <LineChart
        height={516}
        width={1344}
        id="chart-container"
        margin={{
          top: 4,
          right: 4,
          bottom: 4,
          left: 4,
        }}
      >
        <YAxis
          dataKey="sys"
          type="number"
          domain={[91, 182]}
          interval={0}
          tickFormatter={(tick: number) =>
            tick === 180 ? `>=${tick}` : `${tick}`
          }
          ticks={[100, 110, 120, 130, 140, 150, 158, 170, 180]}
          fontSize="0.75rem"
        />
        <XAxis
          dataKey="dias"
          type="number"
          domain={[58, 122]}
          interval={0}
          tickFormatter={(tick: number) =>
            tick === 120 ? `>=${tick}` : `${tick}`
          }
          ticks={[60, 70, 80, 90, 100, 110, 120]}
          fontSize="0.75rem"
        />

        <ReferenceArea
          x1={58}
          x2={122}
          y1={91}
          y2={182}
          fillOpacity={1}
          fill="red"
        >
          <Label
            value="Level 1"
            offset={0}
            dx={-10}
            dy={10}
            position="insideTopRight"
            fontSize={14}
            fill="#FFFFFF"
          />
        </ReferenceArea>

        <ReferenceArea
          x1={58}
          x2={100}
          y1={91}
          y2={158}
          fillOpacity={1}
          fill="purple"
        >
          <Label
            value="Level 2"
            offset={0}
            dx={-10}
            dy={10}
            position="insideTopRight"
            fontSize={14}
            fill="#FFFFFF"
          />
        </ReferenceArea>

        <ReferenceArea
          x1={58}
          x2={90}
          y1={91}
          y2={140}
          fillOpacity={1}
          fill="yellow"
        >
          <Label
            value="Level 3"
            offset={0}
            dx={-10}
            dy={10}
            position="insideTopRight"
            fontSize={14}
            fill="#FFFFFF"
          />
        </ReferenceArea>

        <ReferenceArea
          x1={58}
          x2={80}
          y1={91}
          y2={122}
          fillOpacity={1}
          fill="green"
        >
          <Label
            value="Level 4"
            offset={0}
            dx={-10}
            dy={10}
            position="insideTopRight"
            fontSize={14}
            fill="#FFFFFF"
          />
        </ReferenceArea>

        <Line
          points={[{ x: referenceValue.x, y: referenceValue.y, value: 100 }]}
        />

        <ReferenceLine
          segment={[
            { x: referenceValue.x, y: 91 },
            { x: referenceValue.x, y: referenceValue.y },
          ]}
          stroke="grey"
          strokeDasharray="3 3"
        />

        <ReferenceLine
          segment={[
            { x: 58, y: referenceValue.y },
            { x: referenceValue.x, y: referenceValue.y },
          ]}
          stroke="grey"
          strokeDasharray="3 3"
        />

        <ReferenceDot
          x={referenceValue.x}
          y={referenceValue.y}
          isFront
          shape={(props) => {
            // Adjust the `cx` and `cy` for proper alignment
            const adjustedX = props.cx - 5;
            const adjustedY = props.cy - 41;

            return (
              <svg x={adjustedX} y={adjustedY} width="100" height="50">
                <polygon
                  points="12,40 -2,33 12,26"
                  fill="#444"
                  transform="rotate(-30, 15, 25)"
                />
                <rect
                  x="10"
                  y="10"
                  rx="10"
                  ry="10"
                  width="80"
                  height="30"
                  fill="#444444"
                />
                <text
                  x="50"
                  y="30"
                  fill="#FFFFFF"
                  fontSize="14"
                  fontFamily="Arial"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {referenceValue.y}/{referenceValue.x}
                </text>
              </svg>
            );
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default SegmentedLineChart;
