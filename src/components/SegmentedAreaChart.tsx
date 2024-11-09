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

const Y_AXIS_BOUNDARIES = {
  MIN: 91,
  MAX: 182,
};

const X_AXIS_BOUNDARIES = {
  MIN: 58,
  MAX: 122,
};

const referenceValue = {
  x: 95,
  y: 125,
};

function getClosestInRange(value: number, range: [number, number]): number {
  const [lowerBound, upperBound] = range;

  if (value <= lowerBound) {
    return lowerBound;
  } else if (value >= upperBound) {
    return upperBound;
  } else {
    return value;
  }
}

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
          domain={[Y_AXIS_BOUNDARIES.MIN, Y_AXIS_BOUNDARIES.MAX]}
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
          domain={[X_AXIS_BOUNDARIES.MIN, X_AXIS_BOUNDARIES.MAX]}
          interval={0}
          tickFormatter={(tick: number) =>
            tick === 120 ? `>=${tick}` : `${tick}`
          }
          ticks={[60, 70, 80, 90, 100, 110, 120]}
          fontSize="0.75rem"
        />

        <ReferenceArea
          x1={X_AXIS_BOUNDARIES.MIN}
          x2={X_AXIS_BOUNDARIES.MAX}
          y1={Y_AXIS_BOUNDARIES.MIN}
          y2={Y_AXIS_BOUNDARIES.MAX}
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
            style={{
              textShadow: "1px 1px #000000",
              fontSize: "0.75rem",
            }}
          />
        </ReferenceArea>

        <ReferenceArea
          x1={X_AXIS_BOUNDARIES.MIN}
          x2={100}
          y1={Y_AXIS_BOUNDARIES.MIN}
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
            style={{
              textShadow: "1px 1px #000000",
              fontSize: "0.75rem",
            }}
          />
        </ReferenceArea>

        <ReferenceArea
          x1={X_AXIS_BOUNDARIES.MIN}
          x2={90}
          y1={Y_AXIS_BOUNDARIES.MIN}
          y2={140}
          fillOpacity={1}
          fill="orange"
        >
          <Label
            value="Level 3"
            offset={0}
            dx={-10}
            dy={10}
            position="insideTopRight"
            fontSize={14}
            fill="#FFFFFF"
            style={{
              textShadow: "1px 1px #000000",
              fontSize: "0.75rem",
            }}
          />
        </ReferenceArea>

        <ReferenceArea
          x1={X_AXIS_BOUNDARIES.MIN}
          x2={80}
          y1={Y_AXIS_BOUNDARIES.MIN}
          y2={X_AXIS_BOUNDARIES.MAX}
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
            style={{
              textShadow: "1px 1px #000000",
              fontSize: "0.75rem",
            }}
          />
        </ReferenceArea>

        <Line
          points={[{ x: referenceValue.x, y: referenceValue.y, value: 100 }]}
        />

        <ReferenceLine
          segment={[
            { x: referenceValue.x, y: Y_AXIS_BOUNDARIES.MIN },
            { x: referenceValue.x, y: referenceValue.y },
          ]}
          stroke="grey"
          strokeDasharray="3 3"
        />

        <ReferenceLine
          segment={[
            { x: X_AXIS_BOUNDARIES.MIN, y: referenceValue.y },
            { x: referenceValue.x, y: referenceValue.y },
          ]}
          stroke="grey"
          strokeDasharray="3 3"
        />

        <ReferenceDot
          x={getClosestInRange(referenceValue.x, [
            X_AXIS_BOUNDARIES.MIN,
            X_AXIS_BOUNDARIES.MAX,
          ])}
          y={getClosestInRange(referenceValue.y, [
            Y_AXIS_BOUNDARIES.MIN,
            Y_AXIS_BOUNDARIES.MAX,
          ])}
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
                  style={{
                    textShadow: "1px 1px #000000",
                    fontSize: "0.75rem",
                  }}
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
