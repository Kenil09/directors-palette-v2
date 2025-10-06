import React from 'react'
import LayoutAnnotationTab from "./LayoutAnnotationTab"
import { useLayoutStore } from '@/store/layout.store'

interface LayoutAnnotationWrapperProps {
    className?: string
}

const LayoutAnnotation: React.FC<LayoutAnnotationWrapperProps> = ({ className = '' }) => {
    const { setActiveTab } = useLayoutStore()

    return (
        <div className={`h-full ${className}`}>
            <LayoutAnnotationTab className="h-full" setActiveTab={setActiveTab} />
        </div>
    )
}

export default LayoutAnnotation
