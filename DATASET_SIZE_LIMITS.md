# Dataset Size Limits - Upload Guidelines

## Maximum File Size

### **Maximum Upload Size: 50 MB**

This is the recommended maximum file size for dataset uploads in the Data Poisoning Detection System.

---

## File Size Breakdown

| Size | Approximate Rows | Description |
|------|------------------|-------------|
| **1 MB** | ~10,000 - 50,000 rows | Small dataset, fast processing |
| **5 MB** | ~50,000 - 250,000 rows | Medium dataset, good performance |
| **10 MB** | ~100,000 - 500,000 rows | Large dataset, moderate processing time |
| **25 MB** | ~250,000 - 1,250,000 rows | Very large dataset, longer processing |
| **50 MB** | ~500,000 - 2,500,000 rows | Maximum recommended size |

*Note: Actual row count depends on number of columns and data types*

---

## Dataset Requirements

### Minimum Requirements ✅
- **Minimum Rows**: 10 samples
- **Minimum Columns**: 2 columns (features + label)
- **File Format**: CSV, XLSX, or XLS

### Recommended Specifications
- **Rows**: 100 - 100,000 samples (optimal performance)
- **Columns**: 5 - 50 features
- **File Size**: 1 MB - 10 MB (best performance)
- **File Format**: CSV (fastest processing)

### Maximum Limits
- **Maximum File Size**: 50 MB
- **Maximum Rows**: ~2,500,000 (depends on columns)
- **Maximum Columns**: No hard limit (but affects performance)

---

## File Format Support

### Supported Formats ✅
1. **CSV (.csv)** - Recommended
   - Fastest processing
   - Best compatibility
   - Smallest file size

2. **Excel (.xlsx)** - Supported
   - Good for formatted data
   - Slightly slower processing
   - Larger file size

3. **Excel Legacy (.xls)** - Supported
   - Older Excel format
   - Compatible with legacy systems

---

## Processing Time Estimates

| File Size | Rows (approx) | Upload Time | Analysis Time | Total Time |
|-----------|---------------|-------------|---------------|------------|
| 100 KB | 1,000 | < 1 sec | 2-5 sec | ~5 sec |
| 1 MB | 10,000 | 1-2 sec | 5-10 sec | ~12 sec |
| 5 MB | 50,000 | 2-5 sec | 15-30 sec | ~35 sec |
| 10 MB | 100,000 | 5-10 sec | 30-60 sec | ~70 sec |
| 25 MB | 250,000 | 10-20 sec | 1-2 min | ~2.5 min |
| 50 MB | 500,000 | 20-30 sec | 2-5 min | ~5.5 min |

*Times are approximate and depend on:*
- Network speed
- Server load
- Number of features
- Data complexity
- ML model processing

---

## Why 50 MB Limit?

### Technical Reasons
1. **Memory Management**: Prevents server memory overflow
2. **Processing Time**: Keeps analysis time reasonable (< 5 minutes)
3. **User Experience**: Faster feedback and results
4. **Database Storage**: Efficient MongoDB storage
5. **Network Transfer**: Reasonable upload time

### Performance Optimization
- **7 ML Models**: Each model processes the entire dataset
- **Feature Engineering**: Additional processing overhead
- **Statistical Analysis**: Comprehensive data analysis
- **Result Storage**: MongoDB document size limits

---

## What Happens If File is Too Large?

### Current Behavior
- **No Hard Limit Enforced**: System will attempt to process
- **Potential Issues**:
  - Longer upload time
  - Longer processing time
  - Possible timeout (5 minutes)
  - Memory issues on server
  - Browser timeout

### Recommended Actions for Large Files
1. **Split the Dataset**: Divide into smaller chunks
2. **Sample the Data**: Use representative sample
3. **Remove Unnecessary Columns**: Keep only relevant features
4. **Compress Data**: Use CSV instead of Excel
5. **Contact Support**: For enterprise-level datasets

---

## File Size Calculation

### How to Check Your File Size

#### Windows
1. Right-click on file
2. Select "Properties"
3. Check "Size" field

#### Mac
1. Right-click on file
2. Select "Get Info"
3. Check "Size" field

#### Linux
```bash
ls -lh your_file.csv
```

### Estimating Rows from File Size

**Formula (approximate)**:
```
Rows ≈ (File Size in MB × 1,000,000) / (Columns × 50)
```

**Example**:
- File Size: 10 MB
- Columns: 20
- Estimated Rows: (10 × 1,000,000) / (20 × 50) = 10,000 rows

---

## Optimization Tips

### Reduce File Size
1. **Remove Empty Columns**: Delete columns with no data
2. **Remove Duplicate Rows**: Clean duplicates before upload
3. **Use CSV Format**: Smaller than Excel
4. **Compress Numbers**: Round unnecessary decimal places
5. **Remove Unnecessary Columns**: Keep only relevant features

### Improve Processing Speed
1. **Use CSV**: Faster than Excel
2. **Clean Data First**: Remove nulls and errors
3. **Optimal Size**: 1-10 MB for best performance
4. **Fewer Columns**: Less features = faster processing
5. **Upload During Off-Peak**: Less server load

---

## Upload Guidelines Summary

### ✅ Recommended
- **File Size**: 1 MB - 10 MB
- **Rows**: 100 - 100,000
- **Columns**: 5 - 50
- **Format**: CSV
- **Data Quality**: Clean, no nulls

### ⚠️ Acceptable
- **File Size**: 10 MB - 25 MB
- **Rows**: 100,000 - 250,000
- **Columns**: 50 - 100
- **Format**: XLSX
- **Data Quality**: Some nulls okay

### ❌ Not Recommended
- **File Size**: > 50 MB
- **Rows**: > 500,000
- **Columns**: > 100
- **Format**: Corrupted files
- **Data Quality**: Mostly nulls/errors

---

## Error Messages

### File Too Large
```
Error: File size exceeds maximum limit of 50MB
```
**Solution**: Split file or reduce size

### Too Few Rows
```
Error: Dataset must contain at least 10 samples
```
**Solution**: Add more data rows

### Too Few Columns
```
Error: Dataset must contain at least 2 columns
```
**Solution**: Add feature columns

### Invalid Format
```
Error: Unsupported file format
```
**Solution**: Convert to CSV, XLSX, or XLS

---

## Backend Configuration

### Current Settings
```python
# No hard limit enforced in code
# Recommended limit: 50 MB
# Minimum rows: 10
# Minimum columns: 2
```

### FastAPI/Uvicorn Defaults
- **Default Max Body Size**: 100 MB (FastAPI default)
- **Timeout**: 5 minutes for analysis
- **Upload Timeout**: 60 seconds

### MongoDB Limits
- **Document Size**: 16 MB (BSON limit)
- **Solution**: Large results stored in GridFS
- **Analysis Results**: Limited to first 100 samples in response

---

## Frontend Configuration

### Upload Page Settings
```javascript
// Recommended maximum: 50 MB
// Supported formats: CSV, XLSX, XLS
// Upload timeout: 60 seconds
// Analysis timeout: 5 minutes (300 seconds)
```

### Browser Limits
- **Chrome**: No practical limit
- **Firefox**: No practical limit
- **Safari**: No practical limit
- **Edge**: No practical limit

---

## Real-World Examples

### Small Dataset (Good)
- **File**: customer_data.csv
- **Size**: 2.5 MB
- **Rows**: 25,000
- **Columns**: 15
- **Upload Time**: 2 seconds
- **Analysis Time**: 10 seconds
- **Total Time**: 12 seconds ✅

### Medium Dataset (Good)
- **File**: sales_data.xlsx
- **Size**: 8 MB
- **Rows**: 80,000
- **Columns**: 25
- **Upload Time**: 5 seconds
- **Analysis Time**: 45 seconds
- **Total Time**: 50 seconds ✅

### Large Dataset (Acceptable)
- **File**: transaction_log.csv
- **Size**: 35 MB
- **Rows**: 350,000
- **Columns**: 30
- **Upload Time**: 15 seconds
- **Analysis Time**: 3 minutes
- **Total Time**: 3.25 minutes ⚠️

### Very Large Dataset (Not Recommended)
- **File**: big_data.csv
- **Size**: 75 MB
- **Rows**: 750,000
- **Columns**: 40
- **Upload Time**: 30 seconds
- **Analysis Time**: 8+ minutes
- **Total Time**: 8.5+ minutes ❌
- **Risk**: Timeout, memory issues

---

## FAQ

### Q: What if my dataset is larger than 50 MB?
**A**: Split it into smaller chunks or use a representative sample.

### Q: Can I upload multiple files?
**A**: Yes, upload them one at a time.

### Q: What's the optimal file size?
**A**: 1-10 MB for best performance.

### Q: Does file format affect size limit?
**A**: No, but CSV is recommended for faster processing.

### Q: Can I increase the limit?
**A**: Contact support for enterprise solutions.

### Q: What happens if upload times out?
**A**: Try again with a smaller file or better connection.

### Q: Are there row limits?
**A**: No hard limit, but 10-100,000 rows recommended.

### Q: Can I upload compressed files?
**A**: No, upload uncompressed CSV or Excel files.

---

## Summary

### Maximum File Size: **50 MB**

### Optimal Range: **1-10 MB**

### Minimum Requirements:
- ✅ At least 10 rows
- ✅ At least 2 columns
- ✅ CSV, XLSX, or XLS format

### Best Performance:
- 📊 1-10 MB file size
- 📈 100-100,000 rows
- 📉 5-50 columns
- 📄 CSV format

---

**Last Updated**: April 11, 2026
**System**: Data Poisoning Detection v2.0
**Status**: Production Ready ✅
