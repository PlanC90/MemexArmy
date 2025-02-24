import toast from 'react-hot-toast';

export async function readJsonFile<T>(filename: string): Promise<T | null> {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to read ${filename}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<boolean> {
  try {
    const response = await fetch(`/data/${filename}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, null, 2),
    });

    if (!response.ok) {
      throw new Error(`Failed to write ${filename}`);
    }

    const result = await response.json();
    if (result.success) {
      toast.success('Data saved successfully!');
      return true;
    } else {
      throw new Error(result.error || 'Failed to save data');
    }
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    toast.error(`Failed to save data to ${filename}`);
    return false;
  }
}
