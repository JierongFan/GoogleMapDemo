import type { ProColumns } from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";
import { AutoComplete, Space, Table, Col, Row, Input, Result } from "antd";
import enUS from "antd/es/locale/en_US";
import usePlacesAutocomplete, { Suggestion, getGeocode, getLatLng } from "use-places-autocomplete";
import { ConfigProvider } from "antd";
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import React, { useState,useRef,useCallback } from "react";

const APIKEY = "AIzaSyCx-qWn_pfiy5s4JafcFrMUA-14nbocAfc"; //expeired 2022-7-30 google api key
const mapContainerStyle = { width: "950px", height: "800px" };
const center = { lat: 43.589046, lng: -79.644119 };

export type TableListItem = {
  key: number;
  name: string;
  lat: number;
  lng: number;
};

type SearchProps = {
  children: React.ReactNode;
};

const tableListDataSource: TableListItem[] = [];

const columns: ProColumns[] = [
  {
    title: "Address",
    width: 120,
    dataIndex: "name",
    fixed: "left"
  }
];

function ToSearch(props: SearchProps) {
  const {
    value,
    suggestions: { data },
    setValue,
  } = usePlacesAutocomplete()

  const [options, setOptions] = useState<{ value: string }[]>([]);

  const onSearch = (searchText: string) => {
    let result = data.map(option => {
      return { "value": option.description }
    });
    setOptions(
      !searchText ? [] : result);
    console.log(result)
  };


  const onSelect = async (address: string) => {
    try {
      const result = await getGeocode({ address });
      const { lat, lng } = await getLatLng(result[0]);
      console.log(lat, lng)
    } catch (error) {
      console.log("error");
    }
  }

  return <AutoComplete
    style={{ width: 600 }}
    //size="large"
    value={value}
    onSelect={onSelect}
    options={options}
    onSearch={onSearch}
    onChange={(e) => {
      setValue(e)
    }}
  >
    {props.children}
  </AutoComplete>
}


export default () => {
  const [list, setList] = useState(tableListDataSource);
  const mapRef = useRef<GoogleMap>();
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: APIKEY,
    libraries: ["places"],
  });

  const onLoad = useCallback((map:any) => (mapRef.current = map), []);


  if (loadError) return <div>"Load Error"</div>;
  if (!isLoaded) return <div>"Loading..."</div>;

  const onSearch = async (address: string) => {
    try {
      const result = await getGeocode({ address });
      const { lat, lng } = await getLatLng(result[0]);
      setList(list => [...list, ({ key: list.length + 1, name: address, lat: lat, lng: lng })]);
      console.log(lat, lng);
    } catch (error) {
      console.log("error");
    }
  }

  return (
    <div>
      <Row justify="space-around" align="stretch">
        <Col span={12}>
          <div className='map-container'>
            <div className='map-controls'>
            </div>
            <div className='map'>
              <GoogleMap
                id="map"
                mapContainerStyle={mapContainerStyle}
                zoom={12}
                center={center}
                onLoad={onLoad}
              >
                {
                  list.map((address)=>
                     {
                      console.log(mapRef)
                     mapRef.current?.panTo({lat:address.lat,lng:address.lng})
                     return <Marker key={address.key} position={{lat:address.lat,lng:address.lng}} />
                    }
                  )
                }
                
              </GoogleMap>
            </div>
          </div>
        </Col>
        <Col span={12} >
          <ConfigProvider locale={enUS}>
            <ToSearch>
              <Input.Search size="large" placeholder="Enter an address" enterButton="Search" allowClear onSearch={onSearch} />
            </ToSearch>
            <ProTable<TableListItem>
              columns={columns}
              pagination={{ pageSize: 10 }}
              rowSelection={{
                selections: [
                  Table.SELECTION_ALL,
                  Table.SELECTION_INVERT,
                  Table.SELECTION_NONE
                ]
              }}
              tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => {
                return (
                  <Space size={16}>
                    <a
                      onClick={() => {
                        setList(list.filter(item => selectedRowKeys.indexOf(item.key) === -1))
                        console.log(selectedRowKeys)
                        onCleanSelected()
                        console.log(selectedRowKeys)
                      }}
                    >
                      Delete
                    </a>
                  </Space>
                );
              }}
              dataSource={list}
              options={false}
              search={false}
              rowKey="key"
            />
          </ConfigProvider>
        </Col>
      </Row>
      <Row>
          
      </Row>
    </div>
  );
};
