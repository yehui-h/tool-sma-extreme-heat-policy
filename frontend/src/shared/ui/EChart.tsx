import { Box } from '@mantine/core'
import * as echarts from 'echarts'
import type { EChartsOption, EChartsType } from 'echarts'
import { useEffect, useRef } from 'react'

interface EChartProps {
  option: EChartsOption
  height: number
}

export function EChart({ option, height }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    chartRef.current = echarts.init(containerRef.current)

    return () => {
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, true)
  }, [option])

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      chartRef.current?.resize()
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return <Box ref={containerRef} h={height} />
}
