import { NextRequest, NextResponse } from "next/server";
import { 
  processScheduledDeliveries, 
  retryFailedDeliveries, 
  getDeliveryStats,
  processPreOpeningNotifications
} from "@/lib/email-scheduler";

/**
 * GET /api/email-scheduler - Get delivery statistics
 */
export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getDeliveryStats();
    
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error getting delivery stats:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to get delivery statistics",
    }, { status: 500 });
  }
}

/**
 * POST /api/email-scheduler - Manually trigger email processing
 * Body can contain:
 * - action: "process" | "retry" | "notifications" (default: "process")
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const action = body?.action || "process";
    
    let results;
    
    switch (action) {
      case "process":
        console.log("🚀 Manually triggering scheduled deliveries...");
        results = await processScheduledDeliveries();
        break;
        
      case "retry":
        console.log("🔄 Manually triggering retry of failed deliveries...");
        results = await retryFailedDeliveries();
        break;
        
      case "notifications":
        console.log("🔔 Manually triggering pre-opening notifications...");
        results = await processPreOpeningNotifications();
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Use 'process', 'retry', or 'notifications'",
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      action,
      data: results,
    });
    
  } catch (error) {
    console.error("❌ Error in email scheduler:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process email scheduler request",
    }, { status: 500 });
  }
} 