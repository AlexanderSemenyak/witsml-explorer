using Witsml.Data;

namespace Witsml.Extensions
{
    public static class WitsmlLogExtensions
    {
        public static string GetStartIndexAsString(this WitsmlLog witsmlLog)
        {
            return witsmlLog.StartIndex == null && string.IsNullOrEmpty(witsmlLog.StartDateTimeIndex)
                ? null
                : witsmlLog.IndexType.Equals(WitsmlLog.WITSML_INDEX_TYPE_MD, System.StringComparison.Ordinal) ? witsmlLog.StartIndex != null ? witsmlLog.StartIndex.ToString() : "" : witsmlLog.StartDateTimeIndex;
        }

        public static string GetEndIndexAsString(this WitsmlLog witsmlLog)
        {
            return witsmlLog.EndIndex == null && string.IsNullOrEmpty(witsmlLog.EndDateTimeIndex)
                ? null
                : witsmlLog.IndexType.Equals(WitsmlLog.WITSML_INDEX_TYPE_MD, System.StringComparison.Ordinal) ? witsmlLog.EndIndex != null ? witsmlLog.EndIndex.ToString() : "" : witsmlLog.EndDateTimeIndex;
        }


        public static bool IsDecreasing(this WitsmlLog log)
        {
            // A log is only decreasing when the direction is "decreasing". Any other value defaults to increasing.
            return WitsmlLog.WITSML_DIRECTION_DECREASING.Equals(log.Direction, System.StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsIncreasing(this WitsmlLog log)
        {
            return !IsDecreasing(log);
        }

        public static bool IsEmpty(this WitsmlLog log)
        {
            return log.StartIndex == null &&
                   log.EndIndex == null &&
                   string.IsNullOrEmpty(log.StartDateTimeIndex) &&
                   string.IsNullOrEmpty(log.EndDateTimeIndex);
        }
    }
}
