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
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import variable from '../Variable';
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DeleteIcon } from '@shopify/polaris-icons';
import { NoteIcon } from '@shopify/polaris-icons';

export default function Template() {
  const { t } = useTranslation();
  const listLimit = 7;
  const shopify = useAppBridge();
  const baseUrl = variable.Base_Url;
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
  const [selected, setSelected] = useState('Select');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const category = [
    { label: 'Select', value: 'Select', disabled: true },
    { label: 'Classic Cotton', value: 'Classic Cotton' },
    { label: 'Premium Cotton', value: 'Premium Cotton' },
    { label: 'Long Sleeve', value: 'Long Sleeve' },
    { label: 'Crew Neck', value: 'Crew Neck' },
    { label: 'Hoodie', value: 'Hoodie' },
    { label: 'Triblend', value: 'Triblend' },
    { label: 'V-Neck', value: 'V-Neck' },
    { label: 'Tank Top', value: 'Tank Top' },
    { label: 'Mugs', value: 'Mugs' },
  ];


  /* Fetch template images from the database using AJAX. */
  useEffect(() => {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    fetch(`${baseUrl}/external/image/imagesList?shop=itgeeks-test.myshopify.com`, {
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


  /* Pagination is functioning based on template images. */
  useEffect(() => {
    if (pagination && pagination.count > pagination.per_page) {
      const totalPages = Math.ceil(pagination.count / pagination.per_page);
      setHasNext(pagination.current_page < totalPages);
      setHasPrevious(pagination.current_page > 1);
      setCurrentPage(pagination.current_page);
    } else {
      setHasNext(false);
      setHasPrevious(false);
    }
  }, [pagination]);

  /* Filter images using the search bar and fetch template images from the database via AJAX. */
  const handleSearchChange = (value) => {
    setSearchValue(value);
    const updatedRequestBody = {
      page: 1,
      limit: listLimit,
      ...(value && value.length >= 3 ? { searchQuery: value } : {}),
    };
    setRequestBody(updatedRequestBody);
  };

  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No Results Found'}
      description={'Try changing the filters or search term'}
      withIllustration
    />
  );

  /* Upload template images using modal validation and post the data to the server. */
  const imageNameInput = (value) => {
    setImageName(value);
    validateForm(value, selected, uploadedFile);
  };
  const handleSelectChange = (value) => {
    setSelected(value);
    validateForm(imageName, value, uploadedFile);
  };
  const validateForm = (name, category, file) => {
    if (name && category && category !== 'Select' && file) {
      setIsButtonEnabled(true);
    } else {
      setIsButtonEnabled(false);
    }
  };
  const handleSubmit = () => {
    setIsButtonLoading(true);
    const requestBody = {
      imageName: imageName,
      category: selected,  
      fileBase64: uploadedFileBase64,
    };

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    fetch(`${baseUrl}/external/image/uploadImage?shop=itgeeks-test.myshopify.com`, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: myHeaders,
      redirect: 'follow'
    })
      .then((res) => res.json())
      .then((data) => {
        setIsButtonLoading(false);  
        console.log(data)
      })
      .catch((err) => console.error(err));
  };

  const [file, setFile] = useState(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState("");

  const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles, _rejectedFiles) => {
    const file = acceptedFiles[0];

    if (file && validImageTypes.includes(file.type)) {
      setFile(file);
      validateForm(imageName, selected, file);
      convertToBase64(file);
    } else {
      setFile(null);
      setUploadedFileBase64("");
      validateForm(imageName, selected, null);
    }
  }, [imageName, selected]);

  const validImageTypes = ["image/jpeg", "image/png"];

  const convertToBase64 = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFileBase64(reader.result.split(',')[1]); // Save base64 encoded string
    };
    reader.readAsDataURL(file);
  };

  const fileUpload = !file && <DropZone.FileUpload actionHint="Accepts only .jpg and .png" />;
  const uploadedFile = file && (
    <Box as="div" padding={{ xs: '400', sm: '400' }}>
      <BlockStack gap="150" inlineAlign="center" align="center">
        <Thumbnail
          size="small"
          alt={file.name}
          source={
            validImageTypes.includes(file.type)
              ? window.URL.createObjectURL(file)
              : NoteIcon
          }
        />
        <Text variant="bodySm" as="p">
          {file.name}{' '}
        </Text>
        <Button
          variant="plain"
          tone="critical"
          onClick={() => {
            setFile(null);
            validateForm(imageName, selected, null);
          }}
        >
          Change
        </Button>
      </BlockStack>
    </Box>
  );


  const resourceName = {
    singular: 'image',
    plural: 'images',
  };

  const rowMarkup = fetchImages.map(
    (
      { id, imageURL, imageName, createdAt, category },
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
      primaryAction={{ content: "Create new template", onAction: () => shopify.modal.show('upload-image') }}
      
    >
      <Modal id="upload-image">
        <Box padding={{ xs: '400', sm: '400' }}>
          <FormLayout>
            <TextField
              label="Image Name (Maximum of 15 character)"
              maxLength="15"
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
            <DropZone onDrop={handleDropZoneDrop} accept={validImageTypes} variableHeight>
              {uploadedFile}
              {fileUpload}
            </DropZone>
          </FormLayout>
        </Box>
        <TitleBar title="Create template and upload new image"></TitleBar>
        <Box as="div" padding={{ xs: '400', sm: '400' }} borderBlockStartWidth="0165" borderColor="border-brand">
          <BlockStack as="div" inlineAlign="end">
            <Button variant="primary" 
              disabled={!isButtonEnabled} 
              onClick={handleSubmit} 
              loading={isButtonLoading}>
              Upload
            </Button>
          </BlockStack> 
        </Box>
      </Modal>
      <Card padding={{ xs: '0', sm: '0' }}>
        <Box padding={{ xs: '400', sm: '400' }}>
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
                setRequestBody({ page: currentPage + 1, limit: listLimit });
              },
              onPrevious: () => {
                setRequestBody({ page: currentPage - 1, limit: listLimit });
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
