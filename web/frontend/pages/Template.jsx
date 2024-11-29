import { 
  Page,
  EmptySearchResult,
  ButtonGroup,
  Button,
  Thumbnail,
  IndexTable,
  Box,
  Text,
  Select,
  Card, 
  TextField,
  Icon,
  useBreakpoints,
  Spinner,
  FormLayout,
  DropZone,
  BlockStack,
} from "@shopify/polaris";
import '../assets/styles.css';
import {Modal, TitleBar, useAppBridge} from '@shopify/app-bridge-react';

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DeleteIcon } from '@shopify/polaris-icons';
import {NoteIcon} from '@shopify/polaris-icons';

export default function Template() {
  const { t } = useTranslation();
  const listLimit = 4;
  const shopify = useAppBridge();
  const [imageName, setImageName] = useState("");
  const [fetchImages, setFetchImages] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pagination, setPagination] = useState([]);
  const [hasNext, setHasNext] = useState(false); 
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestBody, setRequestBody] = useState({ 
    page: 1, 
    limit: listLimit,
  }); 
  const [selected, setSelected] = useState('Classic Cotton');
  
  const category = [
    {label: 'Classic Cotton', value: 'Classic Cotton'},
    {label: 'Premium Cotton', value: 'Premium Cotton'},
    {label: 'Long Sleeve', value: 'Long Sleeve'},
    {label: 'Crew Neck', value: 'Crew Neck'},
    {label: 'Hoodie', value: 'Hoodie'},
    {label: 'Triblend', value: 'Triblend'},
    {label: 'V-Neck', value: 'V-Neck'},
    {label: 'Tank Top', value: 'Tank Top'},
    {label: 'Mugs', value: 'Mugs'},
  ];
 

  useEffect(() => {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    fetch("https://2597-49-249-2-6.ngrok-free.app/external/image/imagesList?shop=dev-themes-testing.myshopify.com", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: myHeaders,
      redirect: 'follow'  
    })
      .then((res) => res.json())
      .then((data) => {
        const items = data?.result.rows || [];
        const itemPagination = data?.result.pagination || []; 
        setPagination(itemPagination);
        setFetchImages(items);   
      })
      .catch((err) => console.error(err));
  }, [requestBody]);

  useEffect(() => {
    if (pagination && pagination.count > pagination.per_page) {
      const totalPages = Math.ceil(pagination.count / pagination.per_page);
      setHasNext(pagination.current_page < totalPages);
      setHasPrevious(pagination.current_page > 1);
      setCurrentPage(pagination.current_page);
    }else{ 
      setHasNext(false);
      setHasPrevious(false);
    }
  }, [pagination]);
  

  const handleSearchChange = (value) => { 
    setSearchValue(value); 
    const updatedRequestBody = {
      page: currentPage,
      limit: listLimit,
      ...(value && value.length >= 3 ? { searchQuery: value } : {}),
    };
    setRequestBody(updatedRequestBody);
  };

  const imageNameInput = (value) => { 
    setImageName(value); 
  };

  const handleSelectChange = useCallback(
    (value) => setSelected(value),
    [],
  );

  const resourceName = {
    singular: 'order',
    plural: 'orders',
  };

  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No Results Found'}
      description={'Try changing the filters or search term'}
      withIllustration
    />
  );


  const [file, setFile] = useState(null);

  const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles, _rejectedFiles) => {
    setFile(acceptedFiles[0]);
  }, []);

  const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];

  const fileUpload = !file && <DropZone.FileUpload />;
  const uploadedFile = file && (
    <BlockStack>
      <Thumbnail
        size="small"
        alt={file.name}
        source={
          validImageTypes.includes(file.type)
            ? window.URL.createObjectURL(file)
            : NoteIcon
        }
      />
      <div>
        {file.name}{' '}
        <Text variant="bodySm" as="p">
          {file.size} bytes
        </Text>
      </div>
    </BlockStack>
  );

  const rowMarkup = fetchImages.map(
    (
      {id, imageURL, imageName, createdAt, category},
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        position={index} 
      >
        <IndexTable.Cell>
          <Thumbnail
            source={imageURL}
            alt=""
          />
        </IndexTable.Cell>
        <IndexTable.Cell>{imageName}</IndexTable.Cell>
        <IndexTable.Cell>{category}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end">
            {createdAt}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell className="template-action__button">
          <ButtonGroup>
            <Button size="slim">Use Template</Button>
            <Button size="slim">
              <Icon source={DeleteIcon} tone="critical" />
            </Button>
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page
      title="Templates"
      primaryAction={{ content: "Upload image", onAction: () => shopify.modal.show('upload-image')}}
    > 
      <Modal id="upload-image"> 
        <Box padding={{xs: '400', sm: '400'}}>
          <FormLayout>
            <TextField
              label="Image Name (Maximum of 12 character)"
              maxLength="12"
              value={imageName}
              onChange={imageNameInput}
              placeholder="Image Name"
              clearButton
              onClearButtonClick={() => imageNameInput("")}
            />
            <Select
              label="Select Category"
              options={category}
              onChange={handleSelectChange}
              value={selected}
            />
            <DropZone onDrop={handleDropZoneDrop}>
              {uploadedFile}
              {fileUpload}
            </DropZone>
          </FormLayout>
        </Box>
        <TitleBar title="Upload New Image">
          <button variant="primary">Upload</button>
        </TitleBar>
      </Modal>
      <Card padding={{xs: '0', sm: '0'}}>
        <Box padding={{xs: '400', sm: '400'}}>
          <TextField
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search By Category/Name"
            clearButton
            onClearButtonClick={() => handleSearchChange("")}
          />
        </Box>
        <Box position="relative">
          <IndexTable
            condensed={useBreakpoints().smDown}
            resourceName={resourceName}
            itemCount={fetchImages.length}
            emptyState={emptyStateMarkup}
            headings={[
              { title: "Image" }, 
              { title: "Name" },
              { title: "Category" },
              { title: "Create Date", alignment: "end" },
              { title: "Action", alignment: "end" },
            ]}
            selectable={false}
            pagination={{
              hasPrevious: hasPrevious,  
              hasNext: hasNext, 
              onNext: () => {
                setRequestBody({page: currentPage+1, limit: listLimit});
              },
              onPrevious: () => {
                setRequestBody({page: currentPage-1, limit: listLimit});
              },
            }}
          >
            {rowMarkup}
          </IndexTable>
          <Box as="span" className="table-loading__spinner" position="absolute">
              <Spinner accessibilityLabel="Loading Spinner" size="large" />
          </Box>
        </Box>
      </Card>
    </Page> 
  );
}
