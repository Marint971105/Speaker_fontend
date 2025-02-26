import mammoth from 'mammoth'

export async function handleFile(file) {
  try {
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })

    const result = await mammoth.convertToHtml({ arrayBuffer })
    return result
  } catch (error) {
    throw new Error('文件处理失败')
  }
}
