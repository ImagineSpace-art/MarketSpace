import { supabase } from '../lib/supabaseClient'

export type AnalyticsEventType =
    | 'store_view'
    | 'listing_view'
    | 'listing_click'
    | 'ad_click'
    | 'listing_share'
    | 'listing_save'
    | 'chat_inquiry'

export type LogEventParams = {
    event_type: AnalyticsEventType
    seller_id?: string | null
    store_id?: string | null
    listing_id?: number | null
    ad_id?: string | null
    actor_id?: string | null
}

export type StoreAnalyticsData = {
    viewsCount: number
    listingClicks: number
    adClicks: number
    storeClicks: number
    totalEngagement: number
    listingSaves: number
    listingShares: number
    customerInquiries: number
    followersCount: number
    viewsChart: { label: string; value: number }[]
    engagementChart: { label: string; value: number }[]
    contentTypeBreakdown: {
        listings: number
        storefront: number
        ads: number
    }
    followersBreakdown: {
        followers: number
        nonFollowers: number
    }
    interactionBreakdown: {
        clicks: number
        saves: number
        shares: number
        inquiries: number
    }
    recentListingsMetrics: Record<number, { views: number; engagement: number }>
}

/**
 * Log an analytics event to Supabase
 */
export async function logAnalyticsEvent(params: LogEventParams): Promise<void> {
    try {
        if (!params.seller_id && !params.store_id) return

        // Auto-detect actor_id if logged in and not supplied
        let actorId = params.actor_id
        if (!actorId) {
            const { data } = await supabase.auth.getSession()
            actorId = data?.session?.user?.id || null
        }

        // Don't count seller viewing their own items
        if (actorId && params.seller_id && actorId === params.seller_id) {
            return
        }

        await supabase.from('analytics_events').insert({
            event_type: params.event_type,
            seller_id: params.seller_id || null,
            store_id: params.store_id || null,
            listing_id: params.listing_id || null,
            ad_id: params.ad_id || null,
            actor_id: actorId || null,
        })
    } catch (err) {
        console.warn('Analytics event logging notice:', err)
    }
}

/**
 * Fetch real aggregated analytics data from Supabase for a seller
 */
export async function fetchStoreAnalytics(
    sellerId: string,
    daysCount: number,
    sellerListingIds: number[] = []
): Promise<StoreAnalyticsData> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysCount)
    const startDateIso = startDate.toISOString()

    // 1. Fetch all analytics events for this seller in the date range
    const { data: eventsData } = await supabase
        .from('analytics_events')
        .select('*')
        .or(`seller_id.eq.${sellerId},store_id.eq.${sellerId}`)
        .gte('created_at', startDateIso)

    const events = eventsData || []

    // 2. Fetch real followers for this store
    const { data: followersData } = await supabase
        .from('store_followers')
        .select('user_id')
        .eq('store_id', sellerId)

    const followerUserIds = new Set((followersData || []).map((f: any) => f.user_id))
    const followersCount = followerUserIds.size

    // 3. Fetch real listing saves from saved_listings for seller's listings
    let realListingSavesCount = 0
    if (sellerListingIds.length > 0) {
        const { count } = await supabase
            .from('saved_listings')
            .select('*', { count: 'exact', head: true })
            .in('listing_id', sellerListingIds)
        realListingSavesCount = count || 0
    }

    // 4. Compute real metric counts
    let listingViews = 0
    let storeViews = 0
    let listingClicks = 0
    let adClicks = 0
    let listingShares = 0
    let customerInquiries = 0
    let eventSaves = 0

    let eventsByFollowers = 0
    let eventsByNonFollowers = 0

    const recentListingsMetrics: Record<number, { views: number; engagement: number }> = {}

    // Daily bucket map
    const dailyViewsMap: Record<string, number> = {}
    const dailyEngagementMap: Record<string, number> = {}

    // Initialize all days in date range with 0
    const pointsCount = daysCount <= 7 ? 7 : daysCount <= 14 ? 14 : 10
    const dayInterval = Math.max(1, Math.round(daysCount / pointsCount))

    for (let i = 0; i < pointsCount; i++) {
        const d = new Date()
        d.setDate(d.getDate() - (pointsCount - 1 - i) * dayInterval)
        const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        dailyViewsMap[dateKey] = 0
        dailyEngagementMap[dateKey] = 0
    }

    events.forEach((ev: any) => {
        const evDate = new Date(ev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        // Follower vs non-follower
        if (ev.actor_id && followerUserIds.has(ev.actor_id)) {
            eventsByFollowers++
        } else {
            eventsByNonFollowers++
        }

        // Per listing tracking
        if (ev.listing_id) {
            if (!recentListingsMetrics[ev.listing_id]) {
                recentListingsMetrics[ev.listing_id] = { views: 0, engagement: 0 }
            }
        }

        switch (ev.event_type) {
            case 'listing_view':
                listingViews++
                if (ev.listing_id && recentListingsMetrics[ev.listing_id]) {
                    recentListingsMetrics[ev.listing_id].views++
                }
                if (dailyViewsMap[evDate] !== undefined) {
                    dailyViewsMap[evDate]++
                }
                break

            case 'store_view':
                storeViews++
                if (dailyViewsMap[evDate] !== undefined) {
                    dailyViewsMap[evDate]++
                }
                break

            case 'listing_click':
                listingClicks++
                if (ev.listing_id && recentListingsMetrics[ev.listing_id]) {
                    recentListingsMetrics[ev.listing_id].engagement++
                }
                if (dailyEngagementMap[evDate] !== undefined) {
                    dailyEngagementMap[evDate]++
                }
                break

            case 'ad_click':
                adClicks++
                if (dailyEngagementMap[evDate] !== undefined) {
                    dailyEngagementMap[evDate]++
                }
                break

            case 'listing_share':
                listingShares++
                if (ev.listing_id && recentListingsMetrics[ev.listing_id]) {
                    recentListingsMetrics[ev.listing_id].engagement++
                }
                if (dailyEngagementMap[evDate] !== undefined) {
                    dailyEngagementMap[evDate]++
                }
                break

            case 'listing_save':
                eventSaves++
                if (ev.listing_id && recentListingsMetrics[ev.listing_id]) {
                    recentListingsMetrics[ev.listing_id].engagement++
                }
                if (dailyEngagementMap[evDate] !== undefined) {
                    dailyEngagementMap[evDate]++
                }
                break

            case 'chat_inquiry':
                customerInquiries++
                if (ev.listing_id && recentListingsMetrics[ev.listing_id]) {
                    recentListingsMetrics[ev.listing_id].engagement++
                }
                if (dailyEngagementMap[evDate] !== undefined) {
                    dailyEngagementMap[evDate]++
                }
                break
        }
    })

    const viewsCount = listingViews + storeViews
    const listingSaves = Math.max(realListingSavesCount, eventSaves)
    const totalEngagement = listingClicks + adClicks + listingShares + listingSaves + customerInquiries

    // Charts arrays
    const viewsChart = Object.entries(dailyViewsMap).map(([label, value]) => ({ label, value }))
    const engagementChart = Object.entries(dailyEngagementMap).map(([label, value]) => ({ label, value }))

    // Content type breakdown
    const totalViewsAndAds = viewsCount + adClicks
    const contentTypeBreakdown = {
        listings: totalViewsAndAds > 0 ? Number(((listingViews / totalViewsAndAds) * 100).toFixed(1)) : 0,
        storefront: totalViewsAndAds > 0 ? Number(((storeViews / totalViewsAndAds) * 100).toFixed(1)) : 0,
        ads: totalViewsAndAds > 0 ? Number(((adClicks / totalViewsAndAds) * 100).toFixed(1)) : 0
    }

    // Followers breakdown
    const totalReach = eventsByFollowers + eventsByNonFollowers
    const followersBreakdown = {
        followers: totalReach > 0 ? Number(((eventsByFollowers / totalReach) * 100).toFixed(1)) : 0,
        nonFollowers: totalReach > 0 ? Number(((eventsByNonFollowers / totalReach) * 100).toFixed(1)) : 100
    }

    // Interaction breakdown
    const interactionBreakdown = {
        clicks: totalEngagement > 0 ? Number((((listingClicks + adClicks) / totalEngagement) * 100).toFixed(1)) : 0,
        saves: totalEngagement > 0 ? Number(((listingSaves / totalEngagement) * 100).toFixed(1)) : 0,
        shares: totalEngagement > 0 ? Number(((listingShares / totalEngagement) * 100).toFixed(1)) : 0,
        inquiries: totalEngagement > 0 ? Number(((customerInquiries / totalEngagement) * 100).toFixed(1)) : 0
    }

    return {
        viewsCount,
        listingClicks,
        adClicks,
        storeClicks: storeViews,
        totalEngagement,
        listingSaves,
        listingShares,
        customerInquiries,
        followersCount,
        viewsChart,
        engagementChart,
        contentTypeBreakdown,
        followersBreakdown,
        interactionBreakdown,
        recentListingsMetrics
    }
}

/**
 * Real Database Store Followers Service
 */
export async function fetchStoreFollowers(storeId: string): Promise<string[]> {
    try {
        const { data } = await supabase
            .from('store_followers')
            .select('user_id')
            .eq('store_id', storeId)
        return (data || []).map((row: any) => row.user_id)
    } catch {
        return []
    }
}

export async function toggleStoreFollowInDb(userId: string, storeId: string): Promise<boolean> {
    try {
        const { data: existing } = await supabase
            .from('store_followers')
            .select('id')
            .eq('user_id', userId)
            .eq('store_id', storeId)
            .maybeSingle()

        if (existing) {
            await supabase
                .from('store_followers')
                .delete()
                .eq('user_id', userId)
                .eq('store_id', storeId)
            return false // Now unfollowed
        } else {
            await supabase
                .from('store_followers')
                .insert({ user_id: userId, store_id: storeId })
            return true // Now following
        }
    } catch (err) {
        console.warn('Failed to update store follow in DB:', err)
        return false
    }
}
