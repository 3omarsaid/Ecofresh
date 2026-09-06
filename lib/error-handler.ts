import { Prisma } from '@prisma/client';

/**
 * Global Error Formatter & Localizer for Next.js Server Actions.
 * Converts raw Prisma errors and technical exceptions into clear Arabic business messages
 * while logging the raw stack trace to stdout/console.error for internal debugging.
 */
export function formatActionError(error: unknown, customFallback?: string): string {
  // Always log raw error for internal server tracing
  console.error('[SERVER_ACTION_ERROR]:', error);

  if (!error) {
    return customFallback || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  }

  // 1. Prisma Known Request Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError || (typeof error === 'object' && error !== null && 'code' in error)) {
    const code = (error as any).code;
    const target = (error as any).meta?.target;

    switch (code) {
      case 'P2002': {
        const fieldStr = Array.isArray(target) ? target.join(', ') : (target || '');
        if (fieldStr.includes('code') || fieldStr.includes('batchId') || fieldStr.includes('orderId') || fieldStr.includes('shipmentId')) {
          return 'عفواً، هذا الرقم المرجعي أو الكود الإشاري مسجل مسبقاً في النظام. يرجى استخدام رقم فريد.';
        }
        if (fieldStr.includes('name')) {
          return 'عفواً، هذا الاسم مسجل مسبقاً بالكامل في النظام.';
        }
        return 'عفواً، البيانات المدخلة تحتوي على قيمة مكررة محجوزة مسبقاً (Unique Constraint).';
      }

      case 'P2003': {
        return 'عفواً، لا يمكن إتمام هذه العملية لارتباط السجل بسجلات تشغيلية، مالية أو مخزنية سابقة.';
      }

      case 'P2025': {
        return 'عفواً، السجل المطلوب غير موجود في قاعدة البيانات أو تم حذفه مسبقاً.';
      }

      case 'P2014': {
        return 'عفواً، التغيير المطلوب ينتهك علاقة إلزامية مع سجل آخر في قاعدة البيانات.';
      }

      default:
        break;
    }
  }

  // 2. Standard Error Instances & Custom Thrown Error Messages
  if (error instanceof Error || (typeof error === 'object' && error !== null && 'message' in error)) {
    const msg = String((error as any).message || '');

    // If message is already localized in Arabic or a known business rule, preserve it intact
    const containsArabic = /[\u0600-\u06FF]/.test(msg);
    if (containsArabic && !msg.includes('PrismaClient') && !msg.includes('Error')) {
      return msg;
    }

    // Known English technical patterns -> Arabic friendly messages
    if (msg.includes('Unique constraint failed')) {
      return 'عفواً، هذا الكود أو الرقم مكرر ومسجل مسبقاً.';
    }
    if (msg.includes('Foreign key constraint failed')) {
      return 'عفواً، السجل مرتبط بسجلات أخرى ولا يمكن حذفه أو تعديله.';
    }
    if (msg.includes('Record to update not found') || msg.includes('Record to delete not found')) {
      return 'عفواً، السجل المطلوب تعديله أو حذفه غير موجود.';
    }
    if (msg.includes('Can\'t reach database server') || msg.includes('Timed out')) {
      return 'تعذر الاتصال بقاعدة البيانات. يرجى التأكد من الاتصال بالشبكة والمحاولة مرة أخرى.';
    }
  }

  // 3. String Errors
  if (typeof error === 'string') {
    const containsArabic = /[\u0600-\u06FF]/.test(error);
    if (containsArabic) return error;
  }

  // 4. Default Safe Arabic Fallback
  return customFallback || 'حدث خطأ غير متوقع في النظام. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.';
}
