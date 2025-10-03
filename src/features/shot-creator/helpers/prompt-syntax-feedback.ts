// Enhanced Dynamic Prompting System 
// Supports bracket notation: [option1, option2, option3]
// Supports wild cards: _wildcard_ (requires wild card library)

import { parseWildCardPrompt, WildCard } from "./wildcard/parser"

export interface DynamicPromptResult {
    isValid: boolean
    hasBrackets: boolean
    hasWildCards: boolean
    expandedPrompts: string[]
    originalPrompt: string
    bracketContent?: string
    options?: string[]
    wildCardNames?: string[]
    previewCount: number
    totalCount: number
    warnings?: string[]
    isCrossCombination?: boolean
}

export interface DynamicPromptConfig {
    maxOptions: number
    maxPreview: number
    trimWhitespace: boolean
}

const DEFAULT_CONFIG: DynamicPromptConfig = {
    maxOptions: 10,        // Maximum bracket options allowed
    maxPreview: 5,         // Maximum prompts to show in preview
    trimWhitespace: true   // Clean up spacing
}

/**
 * Parse dynamic prompt with bracket notation AND wild cards
 * Examples: 
 * - "show an apple in [a garden, in a car, in space] half eaten"
 * - "show _character_ in _location_"
 * - "show _character_ [smiling, frowning] in _location_" (mixed syntax)
 * Returns expanded prompts and metadata
 */
export function parseDynamicPrompt(
    prompt: string,
    config: Partial<DynamicPromptConfig> = {},
    userWildCards: WildCard[] = []
): DynamicPromptResult {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }

    // First check for wild cards
    const wildCardResult = parseWildCardPrompt(prompt, userWildCards)

    if (wildCardResult.hasWildCards) {
        return {
            isValid: wildCardResult.isValid,
            hasBrackets: false,
            hasWildCards: true,
            expandedPrompts: wildCardResult.expandedPrompts,
            originalPrompt: prompt,
            wildCardNames: wildCardResult.wildCardNames,
            previewCount: Math.min(wildCardResult.expandedPrompts.length, finalConfig.maxPreview),
            totalCount: wildCardResult.totalCombinations,
            warnings: wildCardResult.warnings,
            isCrossCombination: wildCardResult.crossCombination
        }
    }

    // Check if prompt contains brackets
    const bracketMatch = prompt.match(/\[([^\[\]]+)\]/)

    if (!bracketMatch) {
        return {
            isValid: true,
            hasBrackets: false,
            hasWildCards: false,
            expandedPrompts: [prompt],
            originalPrompt: prompt,
            previewCount: 1,
            totalCount: 1
        }
    }

    const bracketContent = bracketMatch[1]
    const beforeBracket = prompt.substring(0, bracketMatch.index)
    const afterBracket = prompt.substring(bracketMatch.index! + bracketMatch[0].length)

    // Split options by comma and clean them up
    let options = bracketContent.split(',')

    if (finalConfig.trimWhitespace) {
        options = options.map(option => option.trim()).filter(option => option.length > 0)
    }

    // Validate option count
    if (options.length === 0) {
        return {
            isValid: false,
            hasBrackets: true,
            hasWildCards: false,
            expandedPrompts: [],
            originalPrompt: prompt,
            bracketContent,
            options: [],
            previewCount: 0,
            totalCount: 0
        }
    }

    if (options.length > finalConfig.maxOptions) {
        return {
            isValid: false,
            hasBrackets: true,
            hasWildCards: false,
            expandedPrompts: [],
            originalPrompt: prompt,
            bracketContent,
            options,
            previewCount: 0,
            totalCount: options.length
        }
    }

    // Generate expanded prompts
    const expandedPrompts = options.map(option => {
        let expandedPrompt = beforeBracket + option + afterBracket

        // Clean up extra spaces
        if (finalConfig.trimWhitespace) {
            expandedPrompt = expandedPrompt.replace(/\s+/g, ' ').trim()
        }

        return expandedPrompt
    })

    return {
        isValid: true,
        hasBrackets: true,
        hasWildCards: false,
        expandedPrompts,
        originalPrompt: prompt,
        bracketContent,
        options,
        previewCount: Math.min(expandedPrompts.length, finalConfig.maxPreview),
        totalCount: expandedPrompts.length
    }
}

/**
 * Get preview prompts for UI display
 */
export function getPromptPreview(
    prompt: string,
    config: Partial<DynamicPromptConfig> = {}
): string[] {
    const result = parseDynamicPrompt(prompt, config)
    const finalConfig = { ...DEFAULT_CONFIG, ...config }

    if (!result.isValid || !result.hasBrackets) {
        return result.expandedPrompts
    }

    return result.expandedPrompts.slice(0, finalConfig.maxPreview)
}

/**
 * Check if prompt has valid bracket notation
 */
export function hasValidBrackets(prompt: string): boolean {
    const result = parseDynamicPrompt(prompt)
    return result.isValid && result.hasBrackets
}

/**
 * Calculate total credit cost for dynamic prompt
 */
export function calculateDynamicPromptCost(
    prompt: string,
    creditsPerImage: number,
    config: Partial<DynamicPromptConfig> = {}
): { totalCost: number; imageCount: number; isValid: boolean } {
    const result = parseDynamicPrompt(prompt, config)

    if (!result.isValid) {
        return { totalCost: 0, imageCount: 0, isValid: false }
    }

    const imageCount = result.expandedPrompts.length
    const totalCost = imageCount * creditsPerImage

    return { totalCost, imageCount, isValid: true }
}

/**
 * Validate bracket syntax in real-time
 */
export function validateBracketSyntax(prompt: string): {
    isValid: boolean
    error?: string
    suggestion?: string
} {
    // Check for unmatched brackets
    const openBrackets = (prompt.match(/\[/g) || []).length
    const closeBrackets = (prompt.match(/\]/g) || []).length

    if (openBrackets > closeBrackets) {
        return {
            isValid: false,
            error: 'Missing closing bracket ]',
            suggestion: 'Add ] to close your options'
        }
    }

    if (closeBrackets > openBrackets) {
        return {
            isValid: false,
            error: 'Missing opening bracket [',
            suggestion: 'Add [ before your options'
        }
    }

    if (openBrackets > 1) {
        return {
            isValid: false,
            error: 'Multiple brackets not supported',
            suggestion: 'Use only one [option1, option2] per prompt'
        }
    }

    // Check for empty brackets
    const bracketMatch = prompt.match(/\[([^\[\]]*)\]/)
    if (bracketMatch && bracketMatch[1].trim().length === 0) {
        return {
            isValid: false,
            error: 'Empty brackets',
            suggestion: 'Add options inside brackets: [option1, option2]'
        }
    }

    return { isValid: true }
}