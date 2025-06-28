import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  formatValue?: (value: number) => string
  className?: string
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1.5,
  formatValue = (val) => Math.round(val).toLocaleString(),
  className = '',
}) => {
  const springValue = useSpring(value, {
    stiffness: 150,
    damping: 30,
    duration,
    restDelta: 0.001,
  })

  const displayValue = useTransform(springValue, (val) => formatValue(val))

  useEffect(() => {
    springValue.set(value)
  }, [springValue, value])

  return <motion.span className={className}>{displayValue}</motion.span>
}
