import { useState, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import supabase from "../supabase-client";

interface PostInput {
  title: string;
  content: string;
}

const createPost = async (post: PostInput, imageFile: File) => {
  const filePath = `${post.title}-${Date.now()}-${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, imageFile);

  if (uploadError) {
    throw new Error(uploadError?.message);
  }

  const { data: publicURLData } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, image_url: publicURLData.publicUrl });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const CreatePost = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { mutate } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Stop page reload

    if (!selectedFile) {
      return;
    }

    mutate({ post: { title, content }, imageFile: selectedFile });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        {""}
        <label htmlFor="">Title</label>

        <input
          type="text"
          id="title"
          required
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
      </div>

      <div>
        {""}
        <label htmlFor="">Content</label>

        <textarea
          id="content"
          required
          rows={5}
          onChange={(event) => {
            setContent(event.target.value);
          }}
        />
      </div>

      <div>
        {""}
        <label htmlFor="">Upload Image</label>

        <input
          type="file"
          id="image"
          accept="image/*"
          required
          onChange={handleFileChange}
        />
      </div>

      <button type="submit">Create Post</button>
    </form>
  );
};
