// client/src/composables/comms/useProjectExport.js
import { ref } from 'vue'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import { useAudit } from '@/composables/useAudit'
import { calculateProjectStatus } from './utils/calculateProjectStatus'

export function useProjectExport() {
  const exporting = ref(false)
  const error = ref(null)
  const { logAction } = useAudit()
  
  // Export to CSV
  const exportToCSV = async (projects, filename = 'projects_export') => {
    exporting.value = true
    error.value = null
    
    try {
      // Build CSV content
      const headers = [
        'Title',
        'Description',
        'Region',
        'Status',
        'Priority',
        'Coordinator',
        'Deadline',
        'Tags',
        'Created Date',
        'Created By'
      ]
      
      const rows = projects.map(project => [
        `"${(project.title || '').replace(/"/g, '""')}"`,
        `"${(project.description || '').replace(/"/g, '""')}"`,
        `"${LOUISIANA_REGIONS[project.region]?.name || 'Unknown'}"`,
        `"${formatStatus(calculateProjectStatus(project))}"`,
        `"${(project.priority || 'medium').toUpperCase()}"`,
        `"${project.coordinatorName || 'Unassigned'}"`,
        `"${project.deadline ? formatDate(project.deadline) : 'No deadline'}"`,
        `"${(project.tags || []).join(', ')}"`,
        `"${formatDate(project.createdAt)}"`,
        `"${project.createdByEmail || 'Unknown'}"`,
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}_${formatDateForFilename(new Date())}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Log export action
      await logAction('export_comms_projects', {
        format: 'csv',
        count: projects.length,
        filename: `${filename}.csv`
      })
      
      return true
    } catch (err) {
      console.error('CSV export failed:', err)
      error.value = err.message || 'Export failed'
      return false
    } finally {
      exporting.value = false
    }
  }
  
  // Export to PDF
  const exportToPDF = async (projects, filename = 'projects_report') => {
    exporting.value = true
    error.value = null
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      // Add header
      doc.setFontSize(20)
      doc.text('Louisiana Department of Health', 14, 15)
      doc.setFontSize(16)
      doc.text('Communications Projects Report', 14, 25)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32)
      doc.text(`Total Projects: ${projects.length}`, 14, 38)
      
      // Prepare table data
      const tableHeaders = [
        ['Title', 'Region', 'Status', 'Priority', 'Coordinator', 'Deadline', 'Created']
      ]
      
      const tableData = projects.map(project => [
        (project.title || '').substring(0, 40) + ((project.title || '').length > 40 ? '...' : ''),
        LOUISIANA_REGIONS[project.region]?.name || 'Unknown',
        formatStatus(calculateProjectStatus(project)),
        (project.priority || 'medium').toUpperCase(),
        project.coordinatorName || 'Unassigned',
        project.deadline ? formatDate(project.deadline) : 'None',
        formatDate(project.createdAt)
      ])
      
      // Add table
      doc.autoTable({
        head: tableHeaders,
        body: tableData,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 48, 87] }, // Louisiana blue
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 45 }
      })
      
      // Add summary statistics
      const finalY = doc.lastAutoTable.finalY || 45
      doc.setFontSize(12)
      doc.text('Summary Statistics', 14, finalY + 10)
      doc.setFontSize(10)
      
      const statusCounts = projects.reduce((acc, p) => {
        const status = calculateProjectStatus(p)
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
      
      let yPos = finalY + 18
      Object.entries(statusCounts).forEach(([status, count]) => {
        doc.text(`${formatStatus(status)}: ${count}`, 14, yPos)
        yPos += 6
      })
      
      // Save PDF
      doc.save(`${filename}_${formatDateForFilename(new Date())}.pdf`)
      
      // Log export action
      await logAction('export_comms_projects', {
        format: 'pdf',
        count: projects.length,
        filename: `${filename}.pdf`
      })
      
      return true
    } catch (err) {
      console.error('PDF export failed:', err)
      error.value = err.message || 'Export failed'
      return false
    } finally {
      exporting.value = false
    }
  }
  
  // Export single project details
  const exportProjectDetails = async (project, format = 'pdf') => {
    exporting.value = true
    error.value = null
    
    try {
      if (format === 'pdf') {
        const doc = new jsPDF()
        
        // Header
        doc.setFontSize(18)
        doc.text('Project Details Report', 20, 20)
        doc.setFontSize(10)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 28)
        
        // Project details
        let yPos = 40
        const addDetail = (label, value) => {
          doc.setFont(undefined, 'bold')
          doc.text(`${label}:`, 20, yPos)
          doc.setFont(undefined, 'normal')
          doc.text(value || 'N/A', 60, yPos)
          yPos += 8
        }
        
        addDetail('Title', project.title || 'Untitled')
        addDetail('Description', project.description || 'No description')
        addDetail('Region', LOUISIANA_REGIONS[project.region]?.name || 'Unknown')
        addDetail('Status', formatStatus(calculateProjectStatus(project)))
        addDetail('Priority', (project.priority || 'medium').toUpperCase())
        addDetail('Coordinator', project.coordinatorName || 'Unassigned')
        addDetail('Deadline', project.deadline ? formatDate(project.deadline) : 'None')
        addDetail('Created', formatDate(project.createdAt))
        addDetail('Created By', project.createdByEmail)
        
        if (project.tags?.length > 0) {
          addDetail('Tags', project.tags.join(', '))
        }
        
        doc.save(`project_${project.id}_${formatDateForFilename(new Date())}.pdf`)
      }
      
      return true
    } catch (err) {
      console.error('Project export failed:', err)
      error.value = err.message || 'Export failed'
      return false
    } finally {
      exporting.value = false
    }
  }
  
  // Helper functions
  const formatDate = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : date.toDate()
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const formatDateForFilename = (date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '')
  }
  
  const formatStatus = (status) => {
    if (!status) return 'Unknown'
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  return {
    exporting,
    error,
    exportToCSV,
    exportToPDF,
    exportProjectDetails
  }
}